# ============================================================
#  StaySmart — Windows bootstrap (PowerShell)
# ============================================================
#  This script brings the entire local stack up on a Windows PC:
#    1. Verifies prerequisites (Docker, Node, optional Supabase & ngrok CLIs)
#    2. Creates .env.local from .env.local.example if missing
#    3. Starts Docker Desktop if not running
#    4. `docker compose up -d` for Evolution API + Postgres
#    5. Opens ngrok tunnels (if CLI present)
#    6. Starts Supabase local stack (if supabase CLI present)
#    7. Starts Vite dev server
#
#  USAGE:
#      powershell -ExecutionPolicy Bypass -File .\scripts\bootstrap.ps1
#
#  Set $SkipItems to skip any of the 7 stages, e.g.:
#      powershell -File .\scripts\bootstrap.ps1 -SkipVite
#      powershell -File .\scripts\bootstrap.ps1 -SkipCompose -SkipNgrok
# ============================================================

[CmdletBinding()]
param(
    [switch]$SkipDocker,
    [switch]$SkipCompose,
    [switch]$SkipNgrok,
    [switch]$SkipSupabase,
    [switch]$SkipVite
)

$ErrorActionPreference = 'Continue'
$ProjectRoot = Split-Path -Parent $PSScriptRoot | Split-Path -Parent
Set-Location $ProjectRoot

function Step($title, $block) {
    Write-Host ""
    Write-Host "────── $title ──────" -ForegroundColor Cyan
    try { & $block } catch { Write-Host "Error: $_" -ForegroundColor Red }
}

function Need-Cmd($name) { [bool](Get-Command $name -ErrorAction SilentlyContinue) }
function Confirm($msg) {
    while ($true) {
        $r = Read-Host "$msg [y/n]"
        if ($r -match '^[Yy]') { return $true }
        if ($r -match '^[Nn]') { return $false }
    }
}

# 1 · Prerequisites
Step '1 · Checking prerequisites' {
    $missing = @()
    if (! (Need-Cmd node))       { $missing += 'node' }
    if (! (Need-Cmd docker))     { $missing += 'docker' }
    if (! (Need-Cmd npm))        { $missing += 'npm' }
    if ($missing.Count) {
        Write-Host "Missing required tools: $($missing -join ', ')" -ForegroundColor Red
        Write-Host "Install from: https://nodejs.org + https://docker.com/products/docker-desktop/"
        Confirm "Continue anyway?" | Out-Null
    } else {
        Write-Host ("node {0} · npm {1} · docker {2}" -f (node -v), (npm -v), (docker --version)) -ForegroundColor Green
    }
    Write-Host ("Optional: " + (('supabase ' + (if (Need-Cmd supabase) { (supabase --version | Select-Object -First 1) } else { 'not installed' })) + ' / ' + ('ngrok ' + (if (Need-Cmd ngrok) { (ngrok version) } else { 'not installed' }))))
}

# 2 · .env.local
Step '2 · .env.local' {
    if (Test-Path .env.local) {
        Write-Host ".env.local already exists — kept as-is" -ForegroundColor DarkGray
    } elseif (Test-Path .env.local.example) {
        Copy-Item .env.local.example .env.local
        Write-Host "Copied .env.local.example → .env.local" -ForegroundColor Green
        Write-Host "⚠️  Open .env.local and paste your GOOGLE_API_KEY + SUPABASE_anon key." -ForegroundColor Yellow
        if (! (Confirm "Continue now, or stop?")) { exit 1 }
    } else {
        Write-Host ".env.local.example missing — abort." -ForegroundColor Red
        exit 1
    }
}

# 3 · Start Docker Desktop if not running
if (! $SkipDocker) {
    Step '3 · Docker Desktop' {
        $daemon = docker info 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "Docker daemon already running" -ForegroundColor Green
        } else {
            $paths = @(
                "$env:ProgramFiles\Docker\Docker\Docker Desktop.exe",
                "$env:LOCALAPPDATA\Programs\Docker\Docker\Docker Desktop.exe",
                "$env:ProgramFiles(x86)\Docker\Docker\Docker Desktop.exe"
            )
            $exe = $paths | Where-Object { Test-Path $_ } | Select-Object -First 1
            if ($exe) {
                Start-Process $exe
                Write-Host "Started Docker Desktop. Waiting up to 60 s for daemon..." -ForegroundColor Yellow
                for ($i = 0; $i -lt 60; $i++) {
                    Start-Sleep -Seconds 2
                    if ((docker info 2>&1 | Out-String) -notmatch 'Cannot connect') { break }
                }
                docker info | Out-Null
                if ($LASTEXITCODE -ne 0) {
                    Write-Host "Docker daemon didn't come up in time. Continuing anyway." -ForegroundColor DarkYellow
                }
            } else {
                Write-Host "Docker Desktop.exe not found in standard paths. Install it from docker.com." -ForegroundColor Red
            }
        }
    }
}

# 4 · docker compose up Evolution API
if (! $SkipCompose) {
    Step '4 · docker compose (Evolution API + Postgres)' {
        if (! (Test-Path docker-compose.yml)) {
            Write-Host "docker-compose.yml missing — abort stage." -ForegroundColor Red
        } else {
            docker compose up -d
            Start-Sleep -Seconds 6
            docker compose ps
            Write-Host "Evolution will be on http://localhost:8080" -ForegroundColor Green
        }
    }
}

# 5 · ngrok tunnels
if (! $SkipNgrok) {
    Step '5 · ngrok tunnels' {
        if (! (Need-Cmd ngrok)) {
            Write-Host "ngrok CLI not installed. Skipping. (Get it from https://ngrok.com)" -ForegroundColor DarkYellow
        } elseif (! (Test-Path ngrok.yml)) {
            Write-Host "ngrok.yml missing — skipping." -ForegroundColor DarkYellow
        } else {
            # Background the ngrok process
            Start-Process -FilePath "ngrok" -ArgumentList "start --all --config ./ngrok.yml" -WindowStyle Hidden -RedirectStandardOutput "$ProjectRoot\ngrok.log" -RedirectStandardError "$ProjectRoot\ngrok.log"
            Write-Host "ngrok started (background). Tail .\ngrok.log for the live URLs." -ForegroundColor Green
            Write-Host "↑ Copy the printed https URL of the 'supabase-local' tunnel into .env.local as NGROK_URL." -ForegroundColor Yellow
        }
    }
}

# 6 · supabase start
if (! $SkipSupabase) {
    Step '6 · supabase local stack' {
        if (! (Need-Cmd supabase)) {
            Write-Host "supabase CLI not installed. Skipping. (Get it from https://supabase.com/docs/guides/cli)" -ForegroundColor DarkYellow
        } else {
            supabase start
        }
    }
}

# 7 · Vite dev
if (! $SkipVite) {
    Step '7 · Vite dev server (npm run dev)' {
        if (! (Test-Path node_modules)) {
            Write-Host "node_modules missing — installing..." -ForegroundColor Yellow
            npm install --no-audit --no-fund
        }
        Write-Host "Press Ctrl+C to stop Vite." -ForegroundColor Green
        npm run dev
    }
}

Write-Host ""
Write-Host "✦ Done. Web app: http://localhost:5173  ·  Evolution API: http://localhost:8080" -ForegroundColor Cyan
