#!/usr/bin/env bash
# ===========================================================
#  StaySmart — Linux / macOS / WSL bootstrap
# ===========================================================
#  Usage:
#      bash scripts/bootstrap.sh                   # do everything
#      SKIP_DOCKER=1 SKIP_NGROK=1 bash scripts/bootstrap.sh
#
#  Reads .env.local.example, starts Docker Compose + ngrok,
#  optionally starts `supabase start` and Vite dev server.
# ===========================================================

set -uo pipefail
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

GREEN='\033[0;32m'; CYAN='\033[0;36m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'

need() { command -v "$1" >/dev/null 2>&1; }
step() { echo; echo -e "${CYAN}── $1 ──${NC}"; }
ok()   { echo -e "${GREEN}$1${NC}"; }
warn() { echo -e "${YELLOW}$1${NC}"; }
err()  { echo -e "${RED}$1${NC}"; }

# 1. Prerequisites
step "1 · Checking prerequisites"
MISSING=()
need node       || MISSING+=("node")
need docker     || MISSING+=("docker")
need npm        || MISSING+=("npm")
if [ ${#MISSING[@]} -gt 0 ]; then
  err "Missing required tools: ${MISSING[*]}"
  warn "Install from https://nodejs.org and https://docker.com/products/docker-desktop/"
  read -rp "Continue anyway? [y/n] " r
  [[ "$r" =~ ^[Yy] ]] || exit 1
else
  ok "node $(node -v) · npm $(npm -v) · docker $(docker --version)"
fi

# 2. .env.local
step "2 · .env.local"
if [ -f .env.local ]; then
  warn ".env.local already exists — kept as-is"
elif [ -f .env.local.example ]; then
  cp .env.local.example .env.local
  ok "Copied .env.local.example → .env.local"
  warn "⚠️  Open .env.local and paste your GOOGLE_API_KEY + Supabase keys."
else
  err ".env.local.example missing — abort."
  exit 1
fi

# 3. Docker daemon
if [ "${SKIP_DOCKER:-}" != "1" ]; then
  step "3 · Docker daemon"
  if docker info >/dev/null 2>&1; then
    ok "Docker daemon already running"
  else
    err "Docker daemon not reachable. Start Docker Desktop (or 'sudo systemctl start docker')."
    read -rp "Continue anyway? [y/n] " r
    [[ "$r" =~ ^[Yy] ]] || exit 1
  fi
fi

# 4. docker compose up
if [ "${SKIP_COMPOSE:-}" != "1" ]; then
  step "4 · docker compose (Evolution API + Postgres)"
  if [ ! -f docker-compose.yml ]; then
    err "docker-compose.yml missing — abort stage."
  else
    docker compose up -d
    sleep 6
    docker compose ps
    ok "Evolution will be on http://localhost:8080"
  fi
fi

# 5. ngrok tunnels (FIX: prompt for authtoken if missing)
if [ "${SKIP_NGROK:-}" != "1" ]; then
  step "5 · ngrok tunnels"
  if ! need ngrok; then
    warn "ngrok CLI not installed. Skip. https://ngrok.com"
  elif [ ! -f ngrok.yml ]; then
    warn "ngrok.yml missing — skip."
  else
    have_token=0
    [ -n "${NGROK_AUTHTOKEN:-}" ] && have_token=1
    ngrok_cfg="$HOME/.config/ngrok/ngrok.yml"
    [ -f "$ngrok_cfg" ] && grep -q 'authtoken' "$ngrok_cfg" 2>/dev/null && have_token=1
    if [ "$have_token" -eq 0 ]; then
      read -rp "ngrok authtoken not configured. Paste it now or skip? [y=paste / n=skip] " r
      if [[ "$r" =~ ^[Yy] ]]; then
        read -rp "ngrok authtoken (https://dashboard.ngrok.com): " token
        if [ -n "$token" ]; then
          ngrok config add-authtoken "$token" >/dev/null 2>&1 && ok "Token installed."
        else
          warn "Empty token — skipping ngrok."; SKIP_NGROK=1
        fi
      else
        warn "Skipping ngrok this run."; SKIP_NGROK=1
      fi
    fi
    if [ "${SKIP_NGROK:-}" != "1" ]; then
      if command -v nohup >/dev/null; then
        nohup ngrok start --all --config ./ngrok.yml >ngrok.log 2>&1 &
      else
        ( ngrok start --all --config ./ngrok.yml >ngrok.log 2>&1 & ) &
        disown 2>/dev/null || true
      fi
      ok "ngrok started (background). Tail $PROJECT_ROOT/ngrok.log"
      warn "↑ Copy 'supabase-local' https URL into .env.local as NGROK_URL."
    fi
  fi
fi

# 6. Supabase local stack
if [ "${SKIP_SUPABASE:-}" != "1" ]; then
  step "6 · supabase local stack"
  if ! need supabase; then
    warn "supabase CLI not installed. Skip. https://supabase.com/docs/guides/cli"
  else
    supabase start
  fi
fi

# 7. Vite dev
if [ "${SKIP_VITE:-}" != "1" ]; then
  step "7 · Vite dev server (npm run dev)"
  if [ ! -d node_modules ]; then
    warn "node_modules missing — installing"
    npm install --no-audit --no-fund
  fi
  ok "Press Ctrl+C to stop Vite."
  npm run dev
fi

echo
ok "Done. Web app: http://localhost:5173 · Evolution: http://localhost:8080"
