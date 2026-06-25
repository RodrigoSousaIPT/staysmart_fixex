// supabase/functions/wa-greet/index.ts
// Triggered by the frontend after `property_clients` INSERT.
// Sends a WhatsApp greeting message to the newly-registered client via Evolution API.
// Reads the property wa_instance_name + name from the DB so we always target the
// right WhatsApp instance.

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const EVOLUTION_URL = Deno.env.get("EVOLUTION_API_URL") ?? "";
const EVOLUTION_KEY = Deno.env.get("EVOLUTION_API_KEY") ?? "";

// Per-language greeting templates — lightweight (no Gemini required for greeting).
const GREETINGS: Record<string, (name: string) => string> = {
  PT: (name) =>
    `Olá! Sou o StaySmart, o seu assistente virtual em ${name}. Posso ajudar com qualquer dúvida durante a sua estadia 🏡`,
  EN: (name) =>
    `Hi! I'm StaySmart, your virtual assistant at ${name}. I can help with any questions during your stay 🏡`,
  ES: (name) =>
    `¡Hola! Soy StaySmart, tu asistente virtual en ${name}. Puedo ayudarte con cualquier duda durante tu estancia 🏡`,
  FR: (name) =>
    `Bonjour ! Je suis StaySmart, votre assistant virtuel à ${name}. Je peux répondre à vos questions pendant votre séjour 🏡`,
  DE: (name) =>
    `Hallo! Ich bin StaySmart, Ihr virtueller Assistent in ${name}. Ich kann Ihnen bei Fragen während Ihres Aufenthalts helfen 🏡`,
  ZH: (name) => `你好！我是 StaySmart，你在 ${name} 的虚拟助手。我可以帮你解答住宿期间遇到的任何问题 🏡`,
  AR: (name) =>
    `مرحبًا! أنا StaySmart، مساعدك الافتراضي في ${name}. يمكنني الرد على أي استفسار خلال فترة إقامتك 🏡`,
  RU: (name) =>
    `Здравствуйте! Я StaySmart — ваш виртуальный ассистент в ${name}. Помогу с любыми вопросами во время проживания 🏡`,
  HI: (name) =>
    `नमस्ते! मैं StaySmart हूँ, ${name} में आपका वर्चुअल असिस्टेंट। आपके ठहरने के दौरान किसी भी प्रश्न में मैं मदद कर सकता हूँ 🏡`,
  BN: (name) =>
    `হ্যালো! আমি StaySmart, ${name}-এ আপনার ভার্চুয়াল সহকারী। আপনার থাকার সময় যেকোনো প্রশ্নে আমি সাহায্য করতে পারি 🏡`,
  UR: (name) =>
    `ہیلو! میں StaySmart ہوں، ${name} میں آپ کا ورچوئل اسسٹنٹ۔ آپ کے قیام کے دوران کسی بھی سوال میں میں مدد کر سکتا ہوں 🏡`,
};

function corsResp(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type",
      "Content-Type": "application/json",
    },
  });
}

function bad(msg: string, status = 400) {
  return corsResp({ error: msg }, status);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers":
          "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  if (!SUPABASE_URL || !SERVICE_ROLE) return bad("Supabase env missing", 500);
  if (!EVOLUTION_URL || !EVOLUTION_KEY) return bad("Evolution env missing", 500);

  let payload: { property_id?: string; client_phone?: string; lang?: string };
  try {
    payload = await req.json();
  } catch {
    return bad("Invalid JSON");
  }

  const { property_id, client_phone, lang = "PT" } = payload;
  if (!property_id || !client_phone) {
    return bad("property_id and client_phone are required");
  }

  // Defensive: Evolution expects digits-only, no "+"
  const digits = String(client_phone).replace(/\D/g, "");
  if (digits.length < 7) return bad("client_phone looks invalid");

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
    auth: { persistSession: false },
  });

  const { data: prop, error: propErr } = await supabase
    .from("properties")
    .select("name, wa_instance_name, wa_status")
    .eq("id", property_id)
    .single();

  if (propErr || !prop) return bad("property not found", 404);
  if (!prop.wa_instance_name) return bad("property has no WhatsApp instance yet — connect it first", 409);

  const tpl = GREETINGS[lang] || GREETINGS.PT;
  const text = tpl(prop.name ?? "your stay");

  // Send via Evolution API v1.8.x
  const endpoint =
    `${EVOLUTION_URL.replace(/\/$/, "")}/message/sendText/${encodeURIComponent(prop.wa_instance_name)}`;
  const evoRes = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: EVOLUTION_KEY,
    },
    body: JSON.stringify({ number: digits, textMessage: { text } }),
  });

  if (!evoRes.ok) {
    const errText = await evoRes.text();
    console.error("Evolution sendText error", evoRes.status, errText);
    return bad(`Evolution sendText failed: ${errText}`, 502);
  }

  // Optional: log to wa_messages so UI shows the greeting
  try {
    const { data: convId } = await supabase.rpc("upsert_wa_conversation", {
      p_property_id: property_id,
      p_guest_phone: digits,
      p_guest_name: null,
      p_last_message_at: new Date().toISOString(),
    });
    if (convId) {
      await supabase.from("wa_messages").insert({
        conversation_id: convId,
        direction: "outbound",
        role: "assistant",
        body: text,
        ai_used: false,
        source: "greeting",
      });
      await supabase
        .from("wa_conversations")
        .update({ last_message_at: new Date().toISOString() })
        .eq("id", convId);
    }
  } catch (e) {
    console.warn("non-fatal: greeting log to wa_messages failed:", e);
  }

  await supabase.from("audit_logs").insert({
    actor: "system:wa-greet",
    action: "wa.greet.sent",
    property_id,
    payload: { phone: digits, lang, text },
  });

  return corsResp({ success: true, text });
});
