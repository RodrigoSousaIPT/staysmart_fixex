# WhatsApp Integration Plan — StaySmart_TESTS / `simon`

**Stack:** Vercel (frontend) + Supabase (Postgres + Edge Functions) + Evolution API (Docker, third-party host).

**Reference implementation:** `/mnt/School/Cachy-OS/Projects/Rellevanth-CRM/` (`WHATSAPP_INTEGRATION.md`, `.hidden/CachyOS development.txt`, `start-evolution.sh`). Same provider, validated endpoint shapes, working `docker run` recipe.

---

## Current state

- WhatsApp section in the dashboard is **UI placeholder only** (`src/App.jsx` ~line 1024, "Monitoring" card). No backend, no DB tables for messages or conversations.
- Existing Supabase tables: `properties`, `property_context`, `property_clients` (with `phone`), `property_utilities`, `users`, `leads`.
- Supabase is the only backend today. No server code in the repo.
- `audit_logs` is referenced in UI copy but the table does not exist yet.
- `property_context` holds AI training data per property — this will feed the system prompt.

---

## Hosting topology

```
┌────────────────────┐         ┌──────────────────────────┐
│  Vercel            │         │  Supabase                │
│  - React SPA       │ ◀─────▶ │  - Postgres              │
│  - vercel.json     │         │  - Edge Functions (Deno) │
│    SPA rewrite     │         │    · wa-webhook          │
│                    │         │    · wa-send             │
└────────────────────┘         │    · wa-instance         │
                               └──────────┬───────────────┘
                                          │ HTTP
                                          ▼
                          ┌──────────────────────────────┐
                          │  Evolution API container     │
                          │  atendai/evolution-api:1.8.7 │
                          │  Docker on:                  │
                          │    - Railway / Fly.io /      │
                          │      Render / VPS            │
                          │  Public URL (HTTPS)          │
                          └──────────────────────────────┘
                                          │
                                          ▼
                                  WhatsApp (Baileys)
```

### Why Evolution API runs outside Vercel

Vercel = serverless functions only. Three blockers:

1. No long-running container. Evolution API holds persistent WebSocket sessions to WhatsApp servers.
2. No persistent local FS for the session store (Baileys writes auth state to disk).
3. Function timeouts (10s hobby, 60s pro). WhatsApp connections are infinite.

So Evolution API has to live on a host that runs Docker continuously. Supabase Edge Functions talk to it via HTTPS — they are serverless and that is fine because they are stateless adapters, not the session holder.

### Hosting options for the Docker container

| Host | Cost | Notes |
|---|---|---|
| **Railway** | $5/mo free credit, then ~$5/mo for 512MB | Easiest. `railway up` from a repo with a Dockerfile. HTTPS by default. **Recommended.** |
| **Fly.io** | Free tier (3 shared VMs) | Good. Persistent volumes for session data. Slightly steeper learning curve. |
| **Render** | Free web service tier | Free tier sleeps after 15min of no traffic → bad for WhatsApp. Paid tier ($7/mo) works. |
| **Hetzner / DigitalOcean droplet** | €4-6/mo | Cheapest in EU + full control. Manual ops. |
| **Local dev with ngrok** | Free | For development only. Tunnel `localhost:8080` to a public URL for webhooks. |

For the school prototype + demo: **Railway** for the hosted instance, **ngrok tunnel** for local development. Both use the same `docker run` recipe.

---

## Provider — Evolution API

Open-source HTTP wrapper around Baileys (WhatsApp Web protocol). Self-hosted via Docker. Endpoint shape is almost identical to Meta Cloud, so swapping later is a config change, not a rewrite.

### Why for this prototype

- **Free.** No per-message fees, no Meta Business verification, no template approval, no 24h window.
- **Self-hosted Docker** → full data control, GDPR story is cleaner than handing payloads to Meta.
- **Multi-instance.** One container can hold many WhatsApp sessions (one per property number).
- **Webhook model identical to Meta Cloud.** Edge Function only needs a provider adapter.
- Large PT-BR ecosystem, working examples in `Rellevanth-CRM`.

### Risks

- Technically violates WhatsApp ToS — Meta can ban the phone number, usually for spam-pattern behavior.
- QR session can drop on container restart; owner must re-scan.
- No SLA. You operate it.
- **Not production-grade for paid SaaS.** Graduation path: Meta WhatsApp Cloud API (or 360dialog as BSP for EU).

### Comparison

| Provider | Cost | Verification | Notes |
|---|---|---|---|
| **Evolution API** | Free, self-host | None | Unofficial, ban risk, ideal for prototype |
| Meta Cloud API | Free tier, then per-msg | Business verification | Official, template approvals |
| 360dialog | Paid BSP | Yes (managed) | EU-based, GDPR-friendly |
| Twilio | $$ per msg | Yes | Best DX, US-centric pricing |

---

## Evolution API Docker setup

### Pinned image

```
atendai/evolution-api:v1.8.7
```

Same version used in `Rellevanth-CRM`. Pin (not `:latest`) to avoid breaking endpoint changes between minor versions.

### Local development (ngrok)

```bash
# 1. Run the container
docker run -d \
  --name evolution-api \
  -p 8080:8080 \
  -e AUTHENTICATION_TYPE=apikey \
  -e AUTHENTICATION_API_KEY=staysmart-dev-key \
  -e WEBHOOK_GLOBAL_URL=https://<ngrok-id>.ngrok-free.app/webhook \
  -e WEBHOOK_GLOBAL_ENABLED=true \
  -e WEBHOOK_EVENTS_MESSAGES_UPSERT=true \
  atendai/evolution-api:v1.8.7

# 2. Tunnel ngrok to Supabase Edge Function URL instead, so Evolution can hit it
ngrok http https://<project>.supabase.co --host-header=rewrite
# OR: set WEBHOOK_GLOBAL_URL directly to the public Supabase Edge endpoint
```

Helper script (mirror `Rellevanth-CRM/start-evolution.sh`):

```bash
#!/usr/bin/env bash
# scripts/start-evolution.sh
set -euo pipefail
echo "==> Starting Evolution API container..."
docker start evolution-api > /dev/null \
    && echo "    Started." \
    || echo "    Not found or failed to start."
```

### Production (Railway)

`Dockerfile` in `evolution/` subfolder (or a separate small repo):

```dockerfile
FROM atendai/evolution-api:v1.8.7
# Image is fully self-contained. Env vars supplied by Railway.
```

`railway.json`:

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": { "builder": "DOCKERFILE", "dockerfilePath": "Dockerfile" },
  "deploy": {
    "startCommand": "node ./dist/src/main.js",
    "healthcheckPath": "/",
    "healthcheckTimeout": 100,
    "restartPolicyType": "ON_FAILURE"
  }
}
```

Railway env vars to set:

| Var | Value |
|---|---|
| `AUTHENTICATION_TYPE` | `apikey` |
| `AUTHENTICATION_API_KEY` | `<generated secret>` — store this in Supabase secrets too |
| `WEBHOOK_GLOBAL_URL` | `https://<project>.supabase.co/functions/v1/wa-webhook` |
| `WEBHOOK_GLOBAL_ENABLED` | `true` |
| `WEBHOOK_EVENTS_MESSAGES_UPSERT` | `true` |
| `WEBHOOK_EVENTS_CONNECTION_UPDATE` | `true` |

Attach a Railway volume to persist Baileys session state across deploys.

---

## Evolution API endpoints used

Confirmed from `Rellevanth-CRM/WHATSAPP_INTEGRATION.md` lines 192-196:

| Endpoint | Purpose |
|---|---|
| `POST /instance/create` | Create a new instance (per property) |
| `GET /instance/connect/{instance}` | Returns QR code base64 PNG for pairing |
| `GET /instance/connectionState/{instance}` | Returns `{ instance: { state: 'open' \| 'connecting' \| 'close' } }` |
| `POST /message/sendText/{instance}` | Send a text message |
| `DELETE /instance/logout/{instance}` | Unlink the WhatsApp account |
| `DELETE /instance/delete/{instance}` | Remove the instance |

All requests carry `apikey: <AUTHENTICATION_API_KEY>` header.

---

## DB schema additions

```sql
-- 1. Property phone binding (which Evolution instance routes to which property)
alter table properties
  add column wa_instance_name text,    -- Evolution API instance name, e.g. "prop_<uuid>"
  add column wa_display_number text;   -- "+351 9xx xxx xxx"

-- 2. Conversations
create table wa_conversations (
  id uuid primary key default gen_random_uuid(),
  property_id uuid references properties(id) on delete cascade,
  guest_phone text not null,
  guest_name text,
  status text default 'open',          -- open | closed | escalated
  last_message_at timestamptz default now(),
  created_at timestamptz default now(),
  unique (property_id, guest_phone)
);

-- 3. Messages
create table wa_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references wa_conversations(id) on delete cascade,
  direction text not null,             -- inbound | outbound
  role text not null,                  -- guest | assistant | owner
  body text not null,
  media_url text,
  provider_message_id text,
  status text,                         -- queued | sent | delivered | read | failed
  ai_used boolean default false,
  created_at timestamptz default now()
);

-- 4. Audit (GDPR)
create table audit_logs (
  id bigserial primary key,
  actor text,                          -- 'system' | user uuid | 'guest:+351...'
  action text not null,                -- wa.inbound | wa.outbound | ai.replied | owner.takeover
  property_id uuid,
  conversation_id uuid,
  payload jsonb,
  created_at timestamptz default now()
);

-- RLS: owners can read only their own conversations/messages.
-- Policy joins wa_conversations -> properties.owner_id = auth.uid().
```

---

## Backend pieces — Supabase Edge Functions

Deno runtime. Stored under `supabase/functions/`. Deploy via `supabase functions deploy <name>`.

### 1. `wa-webhook` — inbound from Evolution API

`supabase/functions/wa-webhook/index.ts` skeleton:

```ts
import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Anthropic from "https://esm.sh/@anthropic-ai/sdk@0.32.0";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);
const claude = new Anthropic({ apiKey: Deno.env.get("ANTHROPIC_API_KEY")! });
const EVOLUTION_URL = Deno.env.get("EVOLUTION_API_URL")!;
const EVOLUTION_KEY = Deno.env.get("EVOLUTION_API_KEY")!;
const WEBHOOK_SECRET = Deno.env.get("EVOLUTION_WEBHOOK_SECRET")!;

serve(async (req) => {
  // 1. Authn — Evolution API sends a configurable secret header
  if (req.headers.get("x-webhook-secret") !== WEBHOOK_SECRET) {
    return new Response("unauthorized", { status: 401 });
  }

  const body = await req.json();
  // body shape (messages.upsert): { event, instance, data: { key, message, ... } }
  if (body.event !== "messages.upsert") return new Response("ok");
  if (body.data?.key?.fromMe) return new Response("ok");   // ignore our own outbound echoes

  const instance = body.instance;
  const fromPhone = body.data.key.remoteJid.split("@")[0];
  const text = body.data.message?.conversation ?? body.data.message?.extendedTextMessage?.text;
  if (!text) return new Response("ok");

  // 2. Resolve property
  const { data: property } = await supabase
    .from("properties").select("id, name, address, owner_id")
    .eq("wa_instance_name", instance).single();
  if (!property) return new Response("unknown instance", { status: 404 });

  // 3. Upsert conversation + insert inbound message
  const { data: conv } = await supabase
    .from("wa_conversations")
    .upsert({ property_id: property.id, guest_phone: fromPhone, last_message_at: new Date() },
            { onConflict: "property_id,guest_phone" })
    .select().single();

  await supabase.from("wa_messages").insert({
    conversation_id: conv.id, direction: "inbound", role: "guest", body: text,
    provider_message_id: body.data.key.id,
  });
  await supabase.from("audit_logs").insert({
    actor: `guest:${fromPhone}`, action: "wa.inbound",
    property_id: property.id, conversation_id: conv.id, payload: body,
  });

  // 4. Skip AI if owner has taken over
  if (conv.status === "escalated") return new Response("ok");

  // 5. Build context + call Claude
  const { data: ctx } = await supabase.from("property_context").select("feature_key, feature_value").eq("property_id", property.id);
  const systemPrompt = buildSystemPrompt(property, ctx ?? []);
  const reply = await claude.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 500,
    system: systemPrompt,
    messages: [{ role: "user", content: text }],
  });
  const replyText = reply.content[0].type === "text" ? reply.content[0].text : "";

  // 6. Persist + send
  await supabase.from("wa_messages").insert({
    conversation_id: conv.id, direction: "outbound", role: "assistant",
    body: replyText, ai_used: true,
  });
  await sendText(instance, fromPhone, replyText);

  return new Response("ok");
});

async function sendText(instance: string, to: string, text: string) {
  await fetch(`${EVOLUTION_URL}/message/sendText/${instance}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: EVOLUTION_KEY },
    body: JSON.stringify({ number: to, text }),
  });
}

function buildSystemPrompt(prop: any, ctx: { feature_key: string; feature_value: string }[]) {
  const ctxLines = ctx.map(c => `- ${c.feature_key}: ${c.feature_value}`).join("\n");
  return `You are the host AI for ${prop.name} at ${prop.address}.
Reply concisely in the guest's language. Never invent facts.

Property context:
${ctxLines}

If unsure or the guest asks something outside scope, say so politely.`;
}
```

### 2. `wa-send` — owner outbound from dashboard

Authed request (owner JWT). Verifies property ownership, persists `wa_messages` row, then POSTs to Evolution.

### 3. `wa-instance` — instance lifecycle

- `POST` action=`create` → calls `POST /instance/create`, returns instance name
- `GET` action=`qr` → calls `GET /instance/connect/{instance}`, returns `{ base64 }`
- `GET` action=`status` → calls `GET /instance/connectionState/{instance}`
- `DELETE` action=`logout` → calls `DELETE /instance/logout/{instance}`

All authed, all check `properties.owner_id = auth.uid()`.

### Supabase secrets

```bash
supabase secrets set \
  EVOLUTION_API_URL=https://<railway-app>.up.railway.app \
  EVOLUTION_API_KEY=<same as Evolution's AUTHENTICATION_API_KEY> \
  EVOLUTION_WEBHOOK_SECRET=<random> \
  ANTHROPIC_API_KEY=<sk-ant-...>
```

`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are auto-injected by Supabase Edge runtime.

---

## Frontend additions

### 1. Onboarding step 4 — WhatsApp connection

New step in `src/OnboardingView.jsx`:

```
[ Connect WhatsApp ]
  ↓ POST /functions/v1/wa-instance { action: "create" }
  ↓ returns { instance_name }
  ↓
[ QR code rendered from base64 ]
  ↓ polls /functions/v1/wa-instance { action: "status" } every 3s
  ↓ when state === "open" → save wa_instance_name to properties → next step
```

### 2. Dashboard — Monitoring card replaced

In `src/App.jsx` ~line 1024, replace the placeholder. Component shape:

- Conversation list for selected property, ordered by `last_message_at desc`.
- Realtime via `supabase.channel('wa').on('postgres_changes', { table: 'wa_messages' }, …)`.
- Each row: avatar (initials), guest_phone or guest_name, last message snippet, unread count, status badge.
- Click row → open conversation drawer.

### 3. Conversation drawer

- Full thread, role-styled bubbles (guest, assistant, owner).
- Owner reply textarea → `POST /functions/v1/wa-send`.
- "Pause AI" toggle → flips `wa_conversations.status` to `escalated`.
- Connection state indicator (calls `wa-instance` status). Shows reconnect QR button if `state !== 'open'`.

### 4. Per-property settings tab

- Canned greeting / fallback message (new `properties.wa_fallback_message` column).
- AI on/off (`properties.wa_ai_enabled`).
- Opt-out keywords (`properties.wa_optout_keywords`, text[]).

---

## AI prompt strategy

System prompt template (built inside `wa-webhook`):

```
You are the host AI for {property.name} at {property.address}.
Reply concisely in the guest's language. Never invent facts.

Property context:
{property_context rows formatted as "- feature_key: feature_value"}

Utilities:
{property_utilities formatted}

If unsure or the guest asks something outside scope, reply with the
configured fallback message and set escalation=true.
```

Use Claude tool-use to return structured `{ reply: string, escalate: boolean }`. If `escalate` → flip conversation status, surface to owner in dashboard.

Model: `claude-haiku-4-5-20251001` — cheap, fast, good enough for short guest replies.

---

## Optional: fragmented sending

`Rellevanth-CRM` splits outbound on blank lines and inserts ~50ms/char (clamped 1-5s) typing delays between fragments to avoid spam detection. Probably overkill for hospitality-style replies (1-2 paragraphs), but worth keeping as a flag in `wa-send` if owners send long announcements.

---

## Security / GDPR

- Evolution → Supabase webhook protected by `x-webhook-secret` header.
- Edge Functions use service-role key, never exposed to client.
- RLS on `wa_conversations` + `wa_messages`: owner can see only their property's threads (join through `properties.owner_id = auth.uid()`).
- All inbound/outbound logged to `audit_logs`.
- Retention: cron job (Supabase scheduled function) purges conversations closed > 90 days. Configurable.
- Guest phone numbers stored only inside RLS-protected tables.
- Privacy policy must mention sub-processors: Anthropic, Evolution API host (Railway), Supabase.

---

## Phases (suggested PR breakdown)

1. **Schema + Evolution running** — migrations applied, Evolution container up on Railway with HTTPS, `wa-webhook` returning 200, secrets wired.
2. **Inbound + storage** — webhook persists messages, dashboard lists conversations (read-only). No AI yet.
3. **Outbound owner send** — `wa-send` Edge Function + dashboard reply input.
4. **AI reply** — Claude integration, system prompt from `property_context`.
5. **Escalation + audit** — pause AI toggle, `audit_logs` writes, retention cron.
6. **Onboarding step 4** — QR connect flow inside `OnboardingView.jsx`.

---

## Open decisions

1. **Where to run Evolution Docker** — Railway (recommended) vs Fly.io vs Hetzner VPS.
2. **One instance per property vs one per owner** — Rellevanth chose per-consultant. For us, per-property is cleaner (owner can hold multiple properties, each with its own number).
3. **MVP cut** — ship phases 1+2 first (read-only inbound) or go straight to phase 4 (AI reply)?
4. **Production graduation** — Meta Cloud API or 360dialog when the project becomes a real product? Decide now so the provider adapter stays thin.
