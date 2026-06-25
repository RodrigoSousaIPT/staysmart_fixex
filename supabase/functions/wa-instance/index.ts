import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const INSTANCE_NAME_RE = /^[a-z0-9-]{1,64}$/;
const EVOLUTION_URL = Deno.env.get("EVOLUTION_API_URL") ?? "";
const EVOLUTION_KEY = Deno.env.get("EVOLUTION_API_KEY") ?? "";
const WEBHOOK_SECRET = Deno.env.get("EVOLUTION_WEBHOOK_SECRET") ?? "";
const WEBHOOK_URL = `${Deno.env.get("SUPABASE_URL")}/functions/v1/wa-webhook`;
const DEBUG = Deno.env.get("DEBUG") === "true";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function log(message: string, data?: unknown) {
  if (DEBUG) {
    if (data) {
      console.log(`[DEBUG] ${message}`, JSON.stringify(data, null, 2));
    } else {
      console.log(`[DEBUG] ${message}`);
    }
  }
}

async function evo(
  method: string,
  path: string,
  body?: unknown,
): Promise<Response> {
  const safeBody = body ? JSON.parse(JSON.stringify(body)) : undefined;
  log(`Evolution API request: ${method} ${path}`, safeBody);

  const res = await fetch(`${EVOLUTION_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      apikey: EVOLUTION_KEY,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  log(`Evolution API response: ${method} ${path}`, {
    status: res.status,
    ok: res.ok,
  });

  if (!res.ok) {
    const errorText = await res.clone().text();
    console.error(`Evolution API error: ${method} ${path}`, {
      status: res.status,
      error: errorText,
    });
    log(`Evolution API error details`, { errorText });
  }

  return res;
}

function json(data: unknown, status = 200): Response {
  log(`Returning JSON response`, { status, data });
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

function text(msg: string, status = 200): Response {
  log(`Returning text response`, { status, msg });
  return new Response(msg, { status, headers: { ...CORS } });
}

serve(async (req) => {
  try {
    const safeHeaders = Object.fromEntries(req.headers);
    delete safeHeaders["authorization"];
    delete safeHeaders["apikey"];
    delete safeHeaders["cookie"];
    log(`Incoming request`, { method: req.method, url: req.url, headers: safeHeaders });

    if (req.method === "OPTIONS") {
      log(`Handling CORS preflight`);
      return new Response("ok", { headers: CORS });
    }

    const authHeader = req.headers.get("Authorization") ?? "";
    log(`Auth header present`, { authHeaderLength: authHeader.length });

    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    log(`Created Supabase client`);

    const { data: { user }, error: authErr } = await supabaseUser.auth.getUser();
    log(`Auth result`, {
      userId: user?.id,
      userEmail: user?.email,
      authError: authErr?.message,
    });

    if (authErr || !user) {
      log(`Auth failed, returning 401`);
      return text("Unauthorized", 401);
    }

    let body: { action: string; propertyId?: string; instanceName?: string };
    try {
      body = await req.json();
      log(`Parsed request body`, body);
    } catch {
      log(`Failed to parse request body`);
      return text("Bad Request", 400);
    }

    const { action, propertyId, instanceName } = body;
    log(`Extracted action data`, { action, propertyId, instanceName });

    async function getOwnedProperty(pid: string) {
      log(`Querying property from database`, { propertyId: pid });
      const { data, error } = await supabaseUser
        .from("properties")
        .select("id, wa_instance_name")
        .eq("id", pid)
        .single();
      log(`Property query result`, {
        found: !!data,
        waInstanceName: data?.wa_instance_name,
        error: error?.message,
      });
      if (error || !data) return null;
      return data;
    }

    if (action === "create") {
      log(`Processing create action`);

      if (!propertyId || !instanceName) {
        log(`Missing required fields for create`);
        return text("propertyId and instanceName required", 400);
      }

      if (!INSTANCE_NAME_RE.test(instanceName)) {
        log(`Invalid instance name format`, { instanceName });
        return text("Invalid instanceName", 400);
      }

      const prop = await getOwnedProperty(propertyId);
      if (!prop) {
        log(`Property not found or not owned by user`);
        return text("Forbidden", 403);
      }

      log(`Creating instance on Evolution`, { instanceName });

      const evoRes = await evo("POST", "/instance/create", {
        instanceName,
        qrcode: true,
        webhook: WEBHOOK_URL,
        webhookByEvents: false,
        webhookBase64: false,
        events: ["MESSAGES_UPSERT"],
      });

      const evoBodyText = await evoRes.clone().text();

      if (!evoRes.ok) {
        const alreadyExists = /already.?exist|already.?in.?use/i.test(evoBodyText);
        log(`Evolution create failed`, { error: evoBodyText, alreadyExists });
        if (!alreadyExists) {
          return text(`Evolution error: ${evoBodyText}`, 502);
        }
        // Instance already exists — persist wa_instance_name so webhook can match property
        const supabaseService = createClient(
          Deno.env.get("SUPABASE_URL")!,
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
        );
        const updateResult = await supabaseService
          .from("properties")
          .update({ wa_instance_name: instanceName })
          .eq("id", propertyId);
        log(`DB update on reconnect`, { error: updateResult.error?.message });
        return json({ instanceAlreadyExists: true });
      }

      log(`Instance created successfully on Evolution, updating database`);

      const supabaseService = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      );
      const updateResult = await supabaseService
        .from("properties")
        .update({ wa_instance_name: instanceName })
        .eq("id", propertyId);

      log(`Database update result`, {
        error: updateResult.error?.message,
      });

      const evoData = await evoRes.json();
      log(`Returning Evolution response`, evoData);
      return json(evoData);
    }

    if (action === "qr" || action === "status") {
      log(`Processing ${action} action`);

      if (!propertyId || !instanceName) {
        log(`Missing required fields for ${action}`);
        return text("propertyId and instanceName required", 400);
      }

      if (!INSTANCE_NAME_RE.test(instanceName)) {
        log(`Invalid instance name format`, { instanceName });
        return text("Invalid instanceName", 400);
      }

      const prop = await getOwnedProperty(propertyId);
      if (!prop || !prop.wa_instance_name || prop.wa_instance_name !== instanceName) {
        log(`Property validation failed for ${action}`, {
          propExists: !!prop,
          waInstanceNameExists: !!prop?.wa_instance_name,
          nameMatches: prop?.wa_instance_name === instanceName,
        });
        return text("Forbidden", 403);
      }

      const path = action === "qr"
        ? `/instance/connect/${encodeURIComponent(instanceName)}`
        : `/instance/connectionState/${encodeURIComponent(instanceName)}`;

      log(`Fetching ${action} from Evolution`, { path });

      const evoRes = await evo("GET", path);
      const evoData = await evoRes.json();

      log(`Evolution ${action} response`, {
        status: evoRes.status,
        ok: evoRes.ok,
        data: evoData,
      });

      return json(evoData, evoRes.ok ? 200 : 502);
    }

    if (action === "save-number") {
      if (!propertyId || !instanceName) return text("propertyId and instanceName required", 400);
      const prop = await getOwnedProperty(propertyId);
      if (!prop || prop.wa_instance_name !== instanceName) return text("Forbidden", 403);

      const evoRes = await evo("GET", `/instance/fetchInstances`);
      if (!evoRes.ok) return text("Evolution error", 502);
      const instances = await evoRes.json();
      const match = (Array.isArray(instances) ? instances : []).find(
        (i: Record<string, unknown>) => i.instance && (i.instance as Record<string, unknown>).instanceName === instanceName
      );
      const displayNumber: string | null =
        (match?.instance as Record<string, unknown> | undefined)?.owner as string ?? null;

      const supabaseService = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      );
      await supabaseService.from("properties").update({ wa_display_number: displayNumber }).eq("id", propertyId);
      return json({ wa_display_number: displayNumber });
    }

    if (action === "logout") {
      log(`Processing logout action`);

      if (!propertyId || !instanceName) {
        log(`Missing required fields for logout`);
        return text("propertyId and instanceName required", 400);
      }

      if (!INSTANCE_NAME_RE.test(instanceName)) {
        log(`Invalid instance name format`, { instanceName });
        return text("Invalid instanceName", 400);
      }

      const prop = await getOwnedProperty(propertyId);
      if (!prop) {
        log(`Property not found for logout`);
        return text("Forbidden", 403);
      }

      log(`Logging out instance on Evolution`, { instanceName });

      const evoRes = await evo("DELETE", `/instance/logout/${instanceName}`);
      if (!evoRes.ok) {
        const evoError = await evoRes.text();
        console.warn(`Failed to logout instance on Evolution: ${evoError}`);
        log(`Evolution logout failed`, { error: evoError });
      } else {
        log(`Instance logged out successfully on Evolution`);
      }

      log(`Updating database to clear wa_instance_name and wa_display_number`);

      const supabaseService = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      );
      const updateResult = await supabaseService
        .from("properties")
        .update({ wa_instance_name: null, wa_display_number: null })
        .eq("id", propertyId);

      log(`Database update result`, {
        error: updateResult.error?.message,
      });

      log(`Logout completed successfully`);
      return text("OK");
    }

    log(`Unknown action received`, { action });
    return text("Unknown action", 400);
  } catch (error) {
    console.error("Function error:", error);
    log(`Caught error`, {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return text("Internal Server Error", 500);
  }
});
