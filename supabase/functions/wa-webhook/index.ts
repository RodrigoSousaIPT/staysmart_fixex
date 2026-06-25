import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const EVOLUTION_URL = Deno.env.get("EVOLUTION_API_URL") ?? "";
const EVOLUTION_KEY = Deno.env.get("EVOLUTION_API_KEY") ?? "";
const GEMINI_KEY = Deno.env.get("GOOGLE_API_KEY") ?? Deno.env.get("GEMINI_API_KEY") ?? "";
const GEMINI_MODEL = Deno.env.get("GEMINI_MODEL") ?? "gemini-2.5-flash-latest";

serve(async (req) => {
  const secret = Deno.env.get("EVOLUTION_WEBHOOK_SECRET");
  // SECURITY: Evolution API v1.8.7 cannot attach custom headers via the
  // /instance/create payload, so EVOLUTION_WEBHOOK_SECRET is intentionally
  // unset during dev testing. Re-enable enforcement (remove the `if (secret)`
  // guard) once Evolution is configured to send the header — either by
  // upgrading to a version that supports per-instance webhook headers, or by
  // setting WEBHOOK_GLOBAL_HEADERS on the Evolution container.
  // DO NOT leave this unset in production.
  if (secret && req.headers.get("x-webhook-secret") !== secret) {
    return new Response("Unauthorized", { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return new Response("Bad Request", { status: 400 });
  }

  if (body.event !== "messages.upsert") {
    return new Response("OK", { status: 200 });
  }

  const data = body.data as Record<string, unknown> | undefined;
  if (!data) return new Response("OK", { status: 200 });

  const key = data.key as Record<string, unknown> | undefined;
  if (key?.fromMe) return new Response("OK", { status: 200 });

  const instance = body.instance as string | undefined;
  const remoteJid = (key?.remoteJid as string | undefined) ?? "";
  const guestPhone = remoteJid.split("@")[0];
  const guestName = (data.pushName as string | undefined) ?? null;

  const message = data.message as Record<string, unknown> | undefined;
  const text: string | undefined =
    (message?.conversation as string | undefined) ??
    ((message?.extendedTextMessage as Record<string, unknown> | undefined)
      ?.text as string | undefined);

  if (!text || !instance || !guestPhone) {
    return new Response("OK", { status: 200 });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { data: prop, error: propErr } = await supabase
    .from("properties")
    .select("id, owner_id, wa_instance_name")
    .eq("wa_instance_name", instance)
    .single();

  if (propErr || !prop) {
    return new Response("Property not found", { status: 404 });
  }

  const { data: convId, error: convErr } = await supabase.rpc(
    "upsert_wa_conversation",
    {
      p_property_id: prop.id,
      p_guest_phone: guestPhone,
      p_guest_name: guestName,
      p_last_message_at: new Date().toISOString(),
    },
  );

  if (convErr || !convId) {
    console.error("upsert_wa_conversation error:", convErr);
    return new Response("DB error", { status: 500 });
  }

  const providerMsgId = (key?.id as string | undefined) ?? null;

  const { error: msgErr } = await supabase.from("wa_messages").insert({
    conversation_id: convId,
    direction: "inbound",
    role: "guest",
    body: text,
    provider_message_id: providerMsgId,
  });

  if (msgErr) {
    console.error("insert message error:", msgErr);
    return new Response("DB error", { status: 500 });
  }

  await supabase.from("audit_logs").insert({
    actor: "guest:" + guestPhone,
    action: "wa.inbound",
    property_id: prop.id,
    conversation_id: convId,
    payload: body,
  });

  // Phase 4: AI auto-reply (only when GOOGLE_API_KEY is set)
  if (GEMINI_KEY && EVOLUTION_URL && EVOLUTION_KEY) {
    try {
      // Fetch property context for system prompt
      const { data: ctxRows } = await supabase
        .from("property_context")
        .select("feature_key, feature_value")
        .eq("property_id", prop.id);

      const contextBlock = (ctxRows ?? [])
        .filter((r: { feature_key: string; feature_value: string }) => r.feature_value?.trim())
        .map((r: { feature_key: string; feature_value: string }) => `- ${r.feature_key}: ${r.feature_value}`)
        .join("\n");

      const systemPrompt = `You are a helpful AI assistant for a vacation rental property. Answer guest questions based on the property information below. Be friendly, concise, and helpful. Reply in the same language the guest uses. Never make up information not listed below; if unsure, suggest contacting the host.

Property Information:
${contextBlock || "(no context provided)"}`;

      // Fetch recent conversation history (last 10 messages, oldest first)
      const { data: historyRows } = await supabase
        .from("wa_messages")
        .select("role, body, direction")
        .eq("conversation_id", convId)
        .order("created_at", { ascending: false })
        .limit(10);

      const history = (historyRows ?? []).reverse().map(
        (m: { role: string; body: string; direction: string }) => ({
          role: m.role === "guest" || m.direction === "inbound" ? "user" : "model",
          parts: [{ text: m.body }],
        }),
      );

      // Call Gemini Generative Language API (no SDK needed)
      const geminiUrl =
        `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
      const geminiRes = await fetch(`${geminiUrl}?key=${GEMINI_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents: history,
          generationConfig: {
            maxOutputTokens: 512,
            temperature: 0.4,
          },
        }),
      });

      if (!geminiRes.ok) {
        console.error("Gemini API error:", geminiRes.status, await geminiRes.text());
      } else {
        const geminiData = await geminiRes.json();
        const replyText: string | undefined =
          geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;

        if (replyText) {
          // Send via Evolution
          const evoRes = await fetch(
            `${EVOLUTION_URL}/message/sendText/${encodeURIComponent(instance)}`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                apikey: EVOLUTION_KEY,
              },
              body: JSON.stringify({
                number: guestPhone,
                textMessage: { text: replyText },
              }),
            },
          );

          if (!evoRes.ok) {
            console.error("Evolution sendText error:", evoRes.status, await evoRes.text());
          } else {
            // Persist AI reply
            await supabase.from("wa_messages").insert({
              conversation_id: convId,
              direction: "outbound",
              role: "assistant",
              body: replyText,
              ai_used: true,
            });

            await supabase
              .from("wa_conversations")
              .update({ last_message_at: new Date().toISOString() })
              .eq("id", convId);
          }
        }
      }
    } catch (aiErr) {
      // AI failure must not break the webhook — inbound message is already stored
      console.error("AI auto-reply error:", aiErr);
    }
  }

  return new Response("OK", { status: 200 });
});
