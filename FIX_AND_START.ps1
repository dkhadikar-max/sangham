# Sangham Backend - Fix and Start (local dev mode)
# Run from C:\Sangham\sangham-backend-src\

Write-Host "=======================================" -ForegroundColor Cyan
Write-Host "  Sangham Backend - Fix and Start"      -ForegroundColor Cyan
Write-Host "  Mode: Local dev (disk storage)"       -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host ""

# ── Helper: run a command quietly and return true/false ──────────────────────
function Test-Command { param($cmd) return ($null -ne (Get-Command $cmd -ErrorAction SilentlyContinue)) }

# ── STEP 1: Clean Linux artifacts ────────────────────────────────────────────
Write-Host "[1/4] Cleaning Linux build artifacts..." -ForegroundColor Yellow
if (Test-Path "node_modules")    { Remove-Item -Recurse -Force "node_modules";    Write-Host "      node_modules removed."    -ForegroundColor Green }
if (Test-Path "package-lock.json") { Remove-Item -Force "package-lock.json";       Write-Host "      package-lock.json removed." -ForegroundColor Green }

# ── STEP 2: npm install ───────────────────────────────────────────────────────
Write-Host ""
Write-Host "[2/4] Installing packages on Windows (2-3 minutes)..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: npm install failed. Ensure Node.js v20+ is installed: https://nodejs.org" -ForegroundColor Red
    exit 1
}
Write-Host "      Packages installed." -ForegroundColor Green

# ── STEP 3: Start PostgreSQL + Redis ─────────────────────────────────────────
Write-Host ""
Write-Host "[3/4] Starting PostgreSQL and Redis..." -ForegroundColor Yellow

# ── Audit: which Docker command is available? ─────────────────────────────────
# Docker Desktop v2+ ships 'docker compose' (space) as a plugin.
# The old standalone 'docker-compose' (hyphen) binary is no longer installed.
# We must detect which is available and use the right one.

$hasDocker        = Test-Command "docker"
$hasComposePlugin = $false
$hasComposeLegacy = Test-Command "docker-compose"

if ($hasDocker) {
    # Test for the v2 plugin: 'docker compose version'
    $pluginTest = docker compose version 2>&1
    if ($LASTEXITCODE -eq 0) { $hasComposePlugin = $true }
}

if (-not $hasDocker) {
    # ── Docker not installed — automatically fall through to no-Docker setup ──
    Write-Host ""
    Write-Host "  Docker not found. Switching to no-Docker mode." -ForegroundColor Yellow
    Write-Host "  Running SETUP_NO_DOCKER.ps1 to install PostgreSQL + Redis natively..." -ForegroundColor Cyan
    Write-Host ""

    if (Test-Path ".\SETUP_NO_DOCKER.ps1") {
        & ".\SETUP_NO_DOCKER.ps1"
        if ($LASTEXITCODE -ne 0) { exit 1 }
        # After no-docker setup, skip to step 4 (migrations)
        Write-Host ""
        Write-Host "  No-Docker setup complete. Continuing with migrations..." -ForegroundColor Green
    } else {
        Write-Host "  SETUP_NO_DOCKER.ps1 not found." -ForegroundColor Red
        Write-Host "  Run it manually: .\SETUP_NO_DOCKER.ps1"   -ForegroundColor White
        exit 1
    }

} elseif (-not $hasComposePlugin -and -not $hasComposeLegacy) {
    # ── Docker found but no compose at all ───────────────────────────────────
    Write-Host ""
    Write-Host "  AUDIT RESULT: 'docker' is installed but Compose is missing." -ForegroundColor Red
    Write-Host "  This usually means Docker Desktop is not running."           -ForegroundColor Yellow
    Write-Host ""
    Write-Host "  Fix: Start Docker Desktop from the Start menu,"              -ForegroundColor Cyan
    Write-Host "  wait for the whale icon in the taskbar to stop animating,"   -ForegroundColor White
    Write-Host "  then re-run this script."                                     -ForegroundColor White
    exit 1

} else {
    # ── Docker is available — use correct syntax ──────────────────────────────
    if ($hasComposePlugin) {
        Write-Host "      Docker Desktop v2+ detected — using 'docker compose' (plugin syntax)." -ForegroundColor Gray
        docker compose up -d postgres redis
    } else {
        Write-Host "      Legacy docker-compose detected." -ForegroundColor Gray
        docker-compose up -d postgres redis
    }

    if ($LASTEXITCODE -ne 0) {
        Write-Host ""
        Write-Host "  docker compose up failed." -ForegroundColor Red
        Write-Host "  Check that Docker Desktop is running (whale icon in taskbar)." -ForegroundColor Yellow
        exit 1
    }

    Write-Host "      Waiting 6 seconds for Postgres to be ready..." -ForegroundColor Gray
    Start-Sleep -Seconds 6
    Write-Host "      Containers up." -ForegroundColor Green
}

# ── STEP 4: Prisma migrations + start ────────────────────────────────────────
Write-Host ""
Write-Host "[4/4] Running Prisma migrations..." -ForegroundColor Yellow
npx prisma migrate dev --name init
if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "  Migration failed. Common causes:"                            -ForegroundColor Red
    Write-Host "  - Postgres container is not ready yet (wait 10s, retry)"    -ForegroundColor White
    Write-Host "  - DATABASE_URL in .env does not match docker-compose.yml"   -ForegroundColor White
    Write-Host "  Retry: npx prisma migrate dev --name init"                  -ForegroundColor Cyan
    exit 1
}
Write-Host "      Migrations complete." -ForegroundColor Green

Write-Host ""
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host "  Dev server starting on port 4000"    -ForegroundColor Cyan
Write-Host "  http://localhost:4000/health"         -ForegroundColor White
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host ""
npm run dev
