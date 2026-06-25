import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const EVOLUTION_URL = Deno.env.get("EVOLUTION_API_URL") ?? "";
const EVOLUTION_KEY = Deno.env.get("EVOLUTION_API_KEY") ?? "";
const DEBUG = Deno.env.get("DEBUG") === "true";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function log(message: string, data?: unknown) {
  if (DEBUG) console.log(`[DEBUG] ${message}`, data ? JSON.stringify(data) : "");
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

function text(msg: string, status = 200): Response {
  return new Response(msg, { status, headers: CORS });
}

serve(async (req) => {
  // Top-of-function env validation so the browser gets a clear message
  // instead of an opaque "Internal Server Error" 500.
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
    return text("Supabase env missing on the function", 503);
  }
  if (!EVOLUTION_URL || !EVOLUTION_KEY) {
    return text("EVOLUTION_API_URL / EVOLUTION_API_KEY secret missing on Supabase", 503);
  }

  try {
    if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

    const authHeader = req.headers.get("Authorization") ?? "";
    const supabaseUser = createClient(
      SUPABASE_URL,
      SUPABASE_ANON_KEY,
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: { user }, error: authErr } = await supabaseUser.auth.getUser();
    if (authErr || !user) return text("Unauthorized", 401);

    let body: { conversationId?: string; body?: string };
    try {
      body = await req.json();
    } catch {
      return text("Bad Request", 400);
    }

    const { conversationId, body: messageText } = body;
    if (!conversationId || !messageText?.trim()) {
      return text("conversationId and body required", 400);
    }

    // Verify ownership: user must own the property linked to the conversation
    const { data: conv, error: convErr } = await supabaseUser
      .from("wa_conversations")
      .select("id, guest_phone, property_id, properties(id, wa_instance_name, owner_id)")
      .eq("id", conversationId)
      .single();

    log("conversation lookup", { conv, convErr: convErr?.message });

    if (convErr || !conv) return text("Forbidden", 403);

    const prop = conv.properties as { id: string; wa_instance_name: string | null; owner_id: string } | null;
    if (!prop || prop.owner_id !== user.id || !prop.wa_instance_name) {
      return text("Forbidden", 403);
    }

    const instanceName = prop.wa_instance_name;
    const guestPhone = conv.guest_phone;

    // Send via Evolution API. Wrap in try/catch + AbortSignal so that
    // unreachable Evolution (e.g. localhost from the Supabase runtime) yields
    // a clear 502 instead of a hung 504.
    let evoRes: Response;
    try {
      evoRes = await fetch(`${EVOLUTION_URL}/message/sendText/${encodeURIComponent(instanceName)}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: EVOLUTION_KEY,
        },
        body: JSON.stringify({
          number: guestPhone,
          textMessage: { text: messageText.trim() },
        }),
        signal: AbortSignal.timeout(20_000),
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error("Evolution sendText fetch threw:", msg);
      return text(`Evolution unreachable: ${msg}`, 502);
    }

    const evoText = await evoRes.clone().text();
    log("Evolution sendText response", { status: evoRes.status, body: evoText });

    if (!evoRes.ok) {
      return text(`Evolution error: ${evoText}`, 502);
    }

    // Persist outbound message
    const supabaseService = createClient(
      SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY,
    );

    const { error: insertErr } = await supabaseService.from("wa_messages").insert({
      conversation_id: conversationId,
      direction: "outbound",
      role: "owner",
      body: messageText.trim(),
      ai_used: false,
    });

    if (insertErr) {
      console.error("insert outbound message error:", insertErr);
      return text("DB error", 500);
    }

    // Update last_message_at on conversation
    await supabaseService
      .from("wa_conversations")
      .update({ last_message_at: new Date().toISOString() })
      .eq("id", conversationId);

    return json({ ok: true });
  } catch (error) {
    console.error("wa-send error:", error);
    return text("Internal Server Error", 500);
  }
});
