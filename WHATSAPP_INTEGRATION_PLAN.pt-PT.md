# Plano de Integração WhatsApp — StaySmart_TESTS / `simon`

**Stack:** Vercel (frontend) + Supabase (Postgres + Edge Functions) + Evolution API (Docker, alojamento de terceiros).

**Implementação de referência:** `/mnt/School/Cachy-OS/Projects/Rellevanth-CRM/` (`WHATSAPP_INTEGRATION.md`, `.hidden/CachyOS development.txt`, `start-evolution.sh`). Mesmo fornecedor, formato dos endpoints validado, receita `docker run` funcional.

---

## Estado actual

- A secção do WhatsApp no painel é apenas **interface de marcador de posição** (`src/App.jsx` linha ~1024, cartão "Monitoring"). Não existe backend nem tabelas na base de dados para mensagens ou conversas.
- Tabelas Supabase existentes: `properties`, `property_context`, `property_clients` (com `phone`), `property_utilities`, `users`, `leads`.
- O Supabase é, hoje, o único backend. Não existe código de servidor no repositório.
- `audit_logs` é referenciado no texto da UI mas a tabela ainda não existe.
- `property_context` guarda dados de treino da IA por propriedade — vai alimentar o prompt do sistema.

---

## Topologia de alojamento

```
┌────────────────────┐         ┌──────────────────────────┐
│  Vercel            │         │  Supabase                │
│  - SPA React       │ ◀─────▶ │  - Postgres              │
│  - vercel.json     │         │  - Edge Functions (Deno) │
│    rewrite SPA     │         │    · wa-webhook          │
│                    │         │    · wa-send             │
└────────────────────┘         │    · wa-instance         │
                               └──────────┬───────────────┘
                                          │ HTTP
                                          ▼
                          ┌──────────────────────────────┐
                          │  Contentor Evolution API     │
                          │  atendai/evolution-api:1.8.7 │
                          │  Docker em:                  │
                          │    - Railway / Fly.io /      │
                          │      Render / VPS            │
                          │  URL público (HTTPS)         │
                          └──────────────────────────────┘
                                          │
                                          ▼
                                  WhatsApp (Baileys)
```

### Porque é que o Evolution API corre fora do Vercel

Vercel = apenas funções serverless. Três bloqueios:

1. Sem contentor de longa duração. O Evolution API mantém sessões WebSocket persistentes com os servidores do WhatsApp.
2. Sem sistema de ficheiros local persistente para a sessão (o Baileys escreve o estado de autenticação em disco).
3. Limites de tempo de função (10s no plano hobby, 60s no pro). As ligações ao WhatsApp são infinitas.

Por isso o Evolution API tem de viver num host que execute Docker continuamente. As Edge Functions do Supabase falam com ele via HTTPS — são serverless e isso é aceitável porque são adaptadores sem estado, não detentoras da sessão.

### Opções de alojamento para o contentor Docker

| Host | Custo | Notas |
|---|---|---|
| **Railway** | $5/mês de crédito grátis, depois ~$5/mês por 512MB | Mais fácil. `railway up` a partir de um repositório com Dockerfile. HTTPS por defeito. **Recomendado.** |
| **Fly.io** | Plano grátis (3 VMs partilhadas) | Bom. Volumes persistentes para os dados da sessão. Curva de aprendizagem um pouco mais íngreme. |
| **Render** | Plano web grátis | O plano grátis adormece após 15min sem tráfego → mau para WhatsApp. O plano pago ($7/mês) funciona. |
| **Hetzner / DigitalOcean droplet** | €4-6/mês | Mais barato na UE + controlo total. Operação manual. |
| **Desenvolvimento local com ngrok** | Grátis | Apenas para desenvolvimento. Túnel de `localhost:8080` para um URL público para os webhooks. |

Para o protótipo escolar + demo: **Railway** para a instância alojada, **túnel ngrok** para desenvolvimento local. Ambos usam a mesma receita `docker run`.

---

## Fornecedor — Evolution API

Wrapper HTTP open-source sobre o Baileys (protocolo WhatsApp Web). Auto-alojado via Docker. O formato dos endpoints é quase idêntico ao do Meta Cloud, por isso trocar mais tarde é mudança de configuração, não reescrita.

### Porquê para este protótipo

- **Grátis.** Sem custos por mensagem, sem verificação Meta Business, sem aprovação de templates, sem janela de 24h.
- **Auto-alojado em Docker** → controlo total dos dados, posição RGPD mais limpa do que entregar payloads à Meta.
- **Multi-instância.** Um contentor pode conter muitas sessões WhatsApp (uma por número de propriedade).
- **Modelo de webhook idêntico ao Meta Cloud.** A Edge Function só precisa de um adaptador de fornecedor.
- Grande ecossistema PT-BR, exemplos funcionais no `Rellevanth-CRM`.

### Riscos

- Viola tecnicamente os Termos de Serviço do WhatsApp — a Meta pode banir o número, normalmente por comportamento tipo spam.
- A sessão QR pode cair no reinício do contentor; o proprietário tem de voltar a fazer scan.
- Sem SLA. É você que opera.
- **Não é grau de produção para SaaS pago.** Caminho de graduação: Meta WhatsApp Cloud API (ou 360dialog como BSP na UE).

### Comparação

| Fornecedor | Custo | Verificação | Notas |
|---|---|---|---|
| **Evolution API** | Grátis, auto-alojado | Nenhuma | Não oficial, risco de banimento, ideal para protótipo |
| Meta Cloud API | Plano grátis, depois por msg | Verificação de empresa | Oficial, aprovação de templates |
| 360dialog | BSP pago | Sim (gerido) | Baseado na UE, amigável ao RGPD |
| Twilio | $$ por msg | Sim | Melhor DX, preços centrados nos EUA |

---

## Configuração Docker do Evolution API

### Imagem fixa

```
atendai/evolution-api:v1.8.7
```

A mesma versão usada no `Rellevanth-CRM`. Fixe (não `:latest`) para evitar quebras nos endpoints entre versões menores.

### Desenvolvimento local (ngrok)

```bash
# 1. Executar o contentor
docker run -d \
  --name evolution-api \
  -p 8080:8080 \
  -e AUTHENTICATION_TYPE=apikey \
  -e AUTHENTICATION_API_KEY=staysmart-dev-key \
  -e WEBHOOK_GLOBAL_URL=https://<ngrok-id>.ngrok-free.app/webhook \
  -e WEBHOOK_GLOBAL_ENABLED=true \
  -e WEBHOOK_EVENTS_MESSAGES_UPSERT=true \
  atendai/evolution-api:v1.8.7

# 2. Fazer túnel do ngrok para o URL da Edge Function do Supabase
ngrok http https://<project>.supabase.co --host-header=rewrite
# OU: definir WEBHOOK_GLOBAL_URL directamente para o endpoint público da Edge do Supabase
```

Script auxiliar (espelhando `Rellevanth-CRM/start-evolution.sh`):

```bash
#!/usr/bin/env bash
# scripts/start-evolution.sh
set -euo pipefail
echo "==> A iniciar contentor Evolution API..."
docker start evolution-api > /dev/null \
    && echo "    Iniciado." \
    || echo "    Não encontrado ou falhou ao iniciar."
```

### Produção (Railway)

`Dockerfile` na subpasta `evolution/` (ou num repositório separado pequeno):

```dockerfile
FROM atendai/evolution-api:v1.8.7
# A imagem é totalmente auto-contida. Variáveis de ambiente fornecidas pelo Railway.
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

Variáveis de ambiente a definir no Railway:

| Variável | Valor |
|---|---|
| `AUTHENTICATION_TYPE` | `apikey` |
| `AUTHENTICATION_API_KEY` | `<segredo gerado>` — guardar também nos secrets do Supabase |
| `WEBHOOK_GLOBAL_URL` | `https://<project>.supabase.co/functions/v1/wa-webhook` |
| `WEBHOOK_GLOBAL_ENABLED` | `true` |
| `WEBHOOK_EVENTS_MESSAGES_UPSERT` | `true` |
| `WEBHOOK_EVENTS_CONNECTION_UPDATE` | `true` |

Anexar um volume Railway para persistir o estado da sessão Baileys entre deploys.

---

## Endpoints do Evolution API usados

Confirmados a partir de `Rellevanth-CRM/WHATSAPP_INTEGRATION.md` linhas 192-196:

| Endpoint | Função |
|---|---|
| `POST /instance/create` | Cria uma nova instância (por propriedade) |
| `GET /instance/connect/{instance}` | Devolve PNG QR code em base64 para emparelhamento |
| `GET /instance/connectionState/{instance}` | Devolve `{ instance: { state: 'open' \| 'connecting' \| 'close' } }` |
| `POST /message/sendText/{instance}` | Envia uma mensagem de texto |
| `DELETE /instance/logout/{instance}` | Desliga a conta WhatsApp |
| `DELETE /instance/delete/{instance}` | Remove a instância |

Todos os pedidos levam o cabeçalho `apikey: <AUTHENTICATION_API_KEY>`.

---

## Adições ao esquema da base de dados

```sql
-- 1. Ligação do telefone à propriedade (que instância Evolution encaminha para que propriedade)
alter table properties
  add column wa_instance_name text,    -- Nome da instância Evolution API, ex.: "prop_<uuid>"
  add column wa_display_number text;   -- "+351 9xx xxx xxx"

-- 2. Conversas
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

-- 3. Mensagens
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

-- 4. Auditoria (RGPD)
create table audit_logs (
  id bigserial primary key,
  actor text,                          -- 'system' | uuid de utilizador | 'guest:+351...'
  action text not null,                -- wa.inbound | wa.outbound | ai.replied | owner.takeover
  property_id uuid,
  conversation_id uuid,
  payload jsonb,
  created_at timestamptz default now()
);

-- RLS: proprietários só conseguem ler as conversas/mensagens das suas propriedades.
-- Política faz join wa_conversations -> properties.owner_id = auth.uid().
```

---

## Peças de backend — Supabase Edge Functions

Runtime Deno. Guardadas em `supabase/functions/`. Deploy via `supabase functions deploy <nome>`.

### 1. `wa-webhook` — entrada vinda do Evolution API

Esqueleto `supabase/functions/wa-webhook/index.ts`:

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
  // 1. Autenticação — Evolution API envia um cabeçalho de segredo configurável
  if (req.headers.get("x-webhook-secret") !== WEBHOOK_SECRET) {
    return new Response("unauthorized", { status: 401 });
  }

  const body = await req.json();
  // formato do body (messages.upsert): { event, instance, data: { key, message, ... } }
  if (body.event !== "messages.upsert") return new Response("ok");
  if (body.data?.key?.fromMe) return new Response("ok");   // ignorar ecos das nossas próprias mensagens

  const instance = body.instance;
  const fromPhone = body.data.key.remoteJid.split("@")[0];
  const text = body.data.message?.conversation ?? body.data.message?.extendedTextMessage?.text;
  if (!text) return new Response("ok");

  // 2. Resolver propriedade
  const { data: property } = await supabase
    .from("properties").select("id, name, address, owner_id")
    .eq("wa_instance_name", instance).single();
  if (!property) return new Response("unknown instance", { status: 404 });

  // 3. Upsert da conversa + inserir mensagem de entrada
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

  // 4. Saltar IA se o proprietário assumiu o controlo
  if (conv.status === "escalated") return new Response("ok");

  // 5. Construir contexto + chamar Claude
  const { data: ctx } = await supabase.from("property_context").select("feature_key, feature_value").eq("property_id", property.id);
  const systemPrompt = buildSystemPrompt(property, ctx ?? []);
  const reply = await claude.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 500,
    system: systemPrompt,
    messages: [{ role: "user", content: text }],
  });
  const replyText = reply.content[0].type === "text" ? reply.content[0].text : "";

  // 6. Persistir + enviar
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
  return `És a IA anfitriã de ${prop.name} em ${prop.address}.
Responde de forma concisa na língua do hóspede. Nunca inventes factos.

Contexto da propriedade:
${ctxLines}

Se não tiveres a certeza ou se o hóspede perguntar algo fora do âmbito, diz isso de forma educada.`;
}
```

### 2. `wa-send` — saída iniciada pelo proprietário a partir do painel

Pedido autenticado (JWT do proprietário). Verifica a posse da propriedade, persiste a linha em `wa_messages`, depois envia POST para o Evolution.

### 3. `wa-instance` — ciclo de vida da instância

- `POST` action=`create` → chama `POST /instance/create`, devolve nome da instância
- `GET` action=`qr` → chama `GET /instance/connect/{instance}`, devolve `{ base64 }`
- `GET` action=`status` → chama `GET /instance/connectionState/{instance}`
- `DELETE` action=`logout` → chama `DELETE /instance/logout/{instance}`

Todos autenticados, todos verificam `properties.owner_id = auth.uid()`.

### Secrets do Supabase

```bash
supabase secrets set \
  EVOLUTION_API_URL=https://<railway-app>.up.railway.app \
  EVOLUTION_API_KEY=<mesma que AUTHENTICATION_API_KEY do Evolution> \
  EVOLUTION_WEBHOOK_SECRET=<aleatório> \
  ANTHROPIC_API_KEY=<sk-ant-...>
```

`SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` são injectados automaticamente pelo runtime das Edge do Supabase.

---

## Adições ao frontend

### 1. Passo 4 do onboarding — ligação WhatsApp

Novo passo em `src/OnboardingView.jsx`:

```
[ Ligar WhatsApp ]
  ↓ POST /functions/v1/wa-instance { action: "create" }
  ↓ devolve { instance_name }
  ↓
[ Código QR desenhado a partir de base64 ]
  ↓ faz polling a /functions/v1/wa-instance { action: "status" } a cada 3s
  ↓ quando state === "open" → guarda wa_instance_name em properties → próximo passo
```

### 2. Painel — cartão de Monitoring substituído

Em `src/App.jsx` linha ~1024, substituir o marcador de posição. Forma do componente:

- Lista de conversas para a propriedade seleccionada, ordenada por `last_message_at desc`.
- Tempo real via `supabase.channel('wa').on('postgres_changes', { table: 'wa_messages' }, …)`.
- Cada linha: avatar (iniciais), `guest_phone` ou `guest_name`, excerto da última mensagem, contagem de não-lidas, badge de estado.
- Clique na linha → abrir gaveta de conversa.

### 3. Gaveta de conversa

- Thread completa, bolhas com estilo conforme o papel (hóspede, assistente, proprietário).
- Caixa de resposta do proprietário → `POST /functions/v1/wa-send`.
- Toggle "Pausar IA" → muda `wa_conversations.status` para `escalated`.
- Indicador de estado da ligação (chama o status do `wa-instance`). Mostra botão QR de reconexão se `state !== 'open'`.

### 4. Separador de definições por propriedade

- Mensagem de boas-vindas / fallback (nova coluna `properties.wa_fallback_message`).
- IA on/off (`properties.wa_ai_enabled`).
- Palavras-chave de opt-out (`properties.wa_optout_keywords`, text[]).

---

## Estratégia do prompt da IA

Template do prompt de sistema (construído dentro de `wa-webhook`):

```
És a IA anfitriã de {property.name} em {property.address}.
Responde de forma concisa na língua do hóspede. Nunca inventes factos.

Contexto da propriedade:
{linhas de property_context formatadas como "- feature_key: feature_value"}

Utilidades:
{property_utilities formatadas}

Se não tiveres a certeza ou se o hóspede perguntar algo fora do âmbito, responde
com a mensagem de fallback configurada e define escalation=true.
```

Usar tool-use do Claude para devolver estrutura `{ reply: string, escalate: boolean }`. Se `escalate` → muda o estado da conversa, mostra ao proprietário no painel.

Modelo: `claude-haiku-4-5-20251001` — barato, rápido, suficiente para respostas curtas a hóspedes.

---

## Opcional: envio fragmentado

O `Rellevanth-CRM` divide a saída por linhas em branco e insere atrasos de digitação de ~50ms/caractere (limitados entre 1-5s) entre fragmentos para evitar detecção de spam. Provavelmente exagero para respostas tipo hotelaria (1-2 parágrafos), mas vale a pena manter como flag em `wa-send` se os proprietários enviarem anúncios longos.

---

## Segurança / RGPD

- Webhook Evolution → Supabase protegido por cabeçalho `x-webhook-secret`.
- As Edge Functions usam a service-role key, nunca exposta ao cliente.
- RLS em `wa_conversations` + `wa_messages`: o proprietário só vê threads das suas propriedades (join através de `properties.owner_id = auth.uid()`).
- Todas as mensagens (entrada/saída) registadas em `audit_logs`.
- Retenção: trabalho agendado (Supabase scheduled function) elimina conversas fechadas há mais de 90 dias. Configurável.
- Números de telefone dos hóspedes guardados apenas em tabelas protegidas por RLS.
- A política de privacidade tem de mencionar os subprocessadores: Anthropic, host do Evolution API (Railway), Supabase.

---

## Fases (divisão sugerida em PRs)

1. **Esquema + Evolution a correr** — migrações aplicadas, contentor Evolution online no Railway com HTTPS, `wa-webhook` a devolver 200, secrets configurados.
2. **Entrada + armazenamento** — webhook persiste mensagens, painel lista conversas (apenas leitura). Sem IA ainda.
3. **Saída iniciada pelo proprietário** — Edge Function `wa-send` + caixa de resposta no painel.
4. **Resposta da IA** — integração Claude, prompt de sistema a partir de `property_context`.
5. **Escalation + auditoria** — toggle de pausar IA, escritas para `audit_logs`, cron de retenção.
6. **Passo 4 do onboarding** — fluxo de ligação por QR dentro de `OnboardingView.jsx`.

---

## Decisões em aberto

1. **Onde correr o Docker do Evolution** — Railway (recomendado) vs Fly.io vs VPS Hetzner.
2. **Uma instância por propriedade vs uma por proprietário** — O Rellevanth escolheu por consultor. Para nós, por propriedade é mais limpo (o proprietário pode ter várias propriedades, cada uma com o seu número).
3. **Corte do MVP** — entregar fases 1+2 primeiro (entrada só leitura) ou ir directo à fase 4 (resposta IA)?
4. **Graduação para produção** — Meta Cloud API ou 360dialog quando o projecto for produto a sério? Decidir já para que o adaptador de fornecedor fique fino.
