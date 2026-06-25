# StaySmart — Fixed Edition (`staysmart_fixed`)

A thin-fix rewrite of the StaySmart hospitality AI SaaS, with:

- 🤖 **Gemini-powered chatbot** (replaces Anthropic Claude in `wa-webhook`)
- 📲 **Local WhatsApp via Docker + Evolution API** (and ngrok for dev webhooks)
- 📨 **Auto greeting**: when an admin registers a client to a property, the
  client receives a "Hi I'm StaySmart..." WhatsApp message.
- 🐛 **Thin bug fixes** in `OnboardingView` (save-number), `App.jsx` (route
  ordering), `index.html`, file hygiene.
- 🗃️ **New migration** (`20260628000000_wa_greet.sql`) that persists
  `wa_display_number` and relaxes `property_clients.phone` to nullable.

> The repository is based on `staysmart_original` (see commit log) — every
> behavioural change in this repo is a deliberate, minimal patch.

---

## 1. Prerequisites

| Tool                    | Version              | Notes                                 |
| ----------------------- | -------------------- | ------------------------------------- |
| Node.js                 | ≥ 20.x               | Local dev (Vite)                      |
| Docker Desktop          | latest               | Runs Evolution API locally            |
| `ngrok` CLI             | latest               | Free static subdomain recommended     |
| Supabase CLI            | ≥ 1.207              | Runs `supabase start` + edge fns      |
| Deno                    | bundled w/ Supabase  | Used to build edge functions          |

---

## 2. Quick start

```bash
# Clone & enter
git clone https://github.com/Simon-Almeida/...  staysmart_fixed
cd staysmart_fixed

# 1) Environment
cp .env.local.example .env.local
# edit .env.local: paste Gemini API key, etc.

# 2) Supabase — local stack (Postgres, Auth, Edge Functions)
#    The first run downloads ~250 MB of Docker images.
supabase start

# 3) Apply the new migration (wa-display-number + relaxation on phone)
supabase db reset                                    # drops + recreates + runs all migrations
# OR (incremental migration only):
supabase migration up

# 4) Edge functions
supabase functions deploy wa-instance --env-file ./functions/.env
supabase functions deploy wa-send     --env-file ./functions/.env
supabase functions deploy wa-webhook  --env-file ./functions/.env
supabase functions deploy wa-greet    --env-file ./functions/.env
# Or run them locally without deploy:
supabase functions serve --env-file functions/.env

# 5) Public webhook via ngrok (in a separate terminal)
#    Auth: ngrok config add-authtoken <TOKEN>
ngrok start --all --config ./ngrok.yml
# → Copy the resulting `https://<sub>.ngrok-free.app` URL into .env.local as NGROK_URL

# 6) Evolution API
docker compose up -d
# Tail logs until you see "Auth Type: apikey applied"
docker compose logs -f evolution-api

# 7) Vite dev server
npm install
npm run dev
# → open http://localhost:5173
```

---

## 3. Verification checklist

- [ ] `supabase status` reports `API URL: http://localhost:54321`
- [ ] `curl http://localhost:8080/` returns HTML from Evolution API
- [ ] `ngrok http 54321` shows an HTTPS tunnel
- [ ] Inside the UI: create a property → scan the WhatsApp QR on the phone →
      the dashboard shows `wa_status: open` and `wa_display_number` populated.
- [ ] Click "Add client" with email + phone + a property → recipient receives
      the WhatsApp greeting within ~5 s. Done.

---

## 4. Changes vs. `staysmart_original`

| File                                       | Change                                                                |
| ------------------------------------------ | --------------------------------------------------------------------- |
| `OnboardingView.jsx`                       | After WhatsApp scan succeeds, call `wa-instance` `save-number`         |
| `App.jsx`                                  | `/auth/reset` route moved **before** the wildcard catch-all            |
| `App.jsx`                                  | `handleAddClient` invokes `wa-greet` after successful insert           |
| `supabase/functions/wa-webhook/index.ts`   | Replaced Anthropic Claude call with Gemini (`gemini-2.5-flash-latest`) |
| `supabase/functions/wa-greet/index.ts`     | **New** edge function for greeting messages                            |
| `supabase/migrations/20260628….sql`        | **New** migration: persists `wa_display_number`                        |
| `.env.local.example`                       | **New** sane defaults + Gemini key placeholder                         |
| `docker-compose.yml`                       | **New** Evolution API v2 + Postgres w/ persisted sessions              |
| `ngrok.yml`                                | **New** tunnels both Evolution API + Supabase                          |
| `index.html`                               | Removed `<!-- Test -->` debug comment                                  |
| `.bak` files                               | Removed (`tailwind.config.js.bak`, `postcss.config.js.bak`)            |

---

## 5. Troubleshooting

- **"Connection refused" on Evolution API:** ensure `EVOLUTION_API_URL`
  matches the docker-compose port. From inside the Edge Function you are on
  the host network (`host.docker.internal:54321`); from your browser it is
  `localhost:8080`.
- **Webhook returns 401 after restart:** clear `evolution_data` volume once
  (`docker compose down -v`) and re-scan the WhatsApp QR.
- **Gemini returns 400:** check `GEMINI_MODEL` — default is the latest
  flash gem. Adjust to `gemini-2.0-flash` or another stable model if needed.
- **Greeting not received:** the row must include a phone number with country
  code, e.g. `+351 912 345 678`. Evolution API rejects malformed numbers
  silently — check Edge Function logs in Supabase Studio → Edge Functions →
  wa-greet → Logs.

---

## 6. Production checklist (out of scope here)

- Drop ngrok — point the Evolution `WEBHOOK_GLOBAL_URL` at the deployed
  Supabase project's HTTPS function URL.
- Lock down `EVOLUTION_API_KEY` and re-enable the `x-webhook-secret` check in
  `wa-webhook/index.ts` (currently soft-disabled for dev — flagged in code).
- Move `wa-greet` invocation to a Postgres trigger if you want true
  out-of-band guarantees.

— Rodrigo / Claude.
