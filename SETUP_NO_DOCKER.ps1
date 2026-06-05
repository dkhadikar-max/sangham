# Sangham - No-Docker local setup
# Installs PostgreSQL and Redis natively on Windows via winget.
# Run once from C:\Sangham\sangham-backend-src\

Write-Host "=======================================" -ForegroundColor Cyan
Write-Host "  Sangham - No-Docker Setup"            -ForegroundColor Cyan
Write-Host "  Installs PostgreSQL + Redis natively" -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host ""

function Test-Command { param($cmd) return ($null -ne (Get-Command $cmd -ErrorAction SilentlyContinue)) }

# ── Check winget is available ─────────────────────────────────────────────────
if (-not (Test-Command "winget")) {
    Write-Host "winget not found." -ForegroundColor Red
    Write-Host "Install the App Installer from the Microsoft Store, then re-run." -ForegroundColor White
    exit 1
}

# ── STEP 1: PostgreSQL ────────────────────────────────────────────────────────
Write-Host "[1/3] Installing PostgreSQL 15..." -ForegroundColor Yellow
$pgInstalled = Test-Command "psql"
if ($pgInstalled) {
    Write-Host "      PostgreSQL already installed." -ForegroundColor Green
} else {
    winget install PostgreSQL.PostgreSQL.15 --silent --accept-package-agreements --accept-source-agreements
    if ($LASTEXITCODE -ne 0) {
        Write-Host "      winget install failed. Install manually from: https://www.postgresql.org/download/windows/" -ForegroundColor Red
        exit 1
    }
    # Refresh PATH for this session
    $env:PATH = [System.Environment]::GetEnvironmentVariable("PATH", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("PATH", "User")
    Write-Host "      PostgreSQL installed." -ForegroundColor Green
}

# ── Create sangham database and user ─────────────────────────────────────────
Write-Host "      Creating sangham database and user..." -ForegroundColor Gray
$pgSetup = @"
DO `$`$ BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'sangham') THEN
    CREATE USER sangham WITH PASSWORD 'password';
  END IF;
END `$`$;
CREATE DATABASE sangham_db OWNER sangham;
GRANT ALL PRIVILEGES ON DATABASE sangham_db TO sangham;
"@
$pgSetup | psql -U postgres 2>&1 | Out-Null
Write-Host "      Database ready." -ForegroundColor Green

# ── STEP 2: Redis via Memurai (Redis-compatible, Windows native) ─────────────
Write-Host ""
Write-Host "[2/3] Installing Memurai (Redis-compatible for Windows)..." -ForegroundColor Yellow
$redisRunning = Test-NetConnection -ComputerName localhost -Port 6379 -WarningAction SilentlyContinue -ErrorAction SilentlyContinue
if ($redisRunning.TcpTestSucceeded) {
    Write-Host "      Redis already running on port 6379." -ForegroundColor Green
} else {
    winget install Memurai.Memurai --silent --accept-package-agreements --accept-source-agreements
    if ($LASTEXITCODE -ne 0) {
        Write-Host ""
        Write-Host "  Memurai install failed. Two alternatives:"          -ForegroundColor Yellow
        Write-Host "  A) Download from: https://www.memurai.com/get-memurai" -ForegroundColor White
        Write-Host "  B) Use Upstash free cloud Redis (no install needed):"  -ForegroundColor White
        Write-Host "     1. Go to https://upstash.com, create a free Redis"  -ForegroundColor White
        Write-Host "     2. Copy the redis:// URL into .env REDIS_URL"       -ForegroundColor White
        Write-Host ""
    } else {
        # Start Memurai service
        Start-Service -Name "Memurai" -ErrorAction SilentlyContinue
        Write-Host "      Memurai (Redis) installed and started." -ForegroundColor Green
    }
}

# ── STEP 3: Update .env to use local PostgreSQL ───────────────────────────────
Write-Host ""
Write-Host "[3/3] Updating .env for local PostgreSQL + Redis..." -ForegroundColor Yellow
$envPath = ".env"
if (Test-Path $envPath) {
    $envContent = Get-Content $envPath -Raw
    $envContent = $envContent -replace 'DATABASE_URL=.*', 'DATABASE_URL="postgresql://sangham:password@localhost:5432/sangham_db"'
    $envContent = $envContent -replace 'REDIS_URL=.*', 'REDIS_URL="redis://localhost:6379"'
    $envContent | Set-Content $envPath -NoNewline
    Write-Host "      .env updated." -ForegroundColor Green
} else {
    Write-Host "      .env not found — skipping update." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=======================================" -ForegroundColor Green
Write-Host "  Setup complete (no Docker needed)"    -ForegroundColor Green
Write-Host "=======================================" -ForegroundColor Green
Write-Host ""
Write-Host "  Next steps:" -ForegroundColor Cyan
Write-Host "    1. npm install"                            -ForegroundColor White
Write-Host "    2. npx prisma migrate dev --name init"    -ForegroundColor White
Write-Host "    3. npm run dev"                            -ForegroundColor White
Write-Host "    4. http://localhost:4000/health"           -ForegroundColor White
Write-Host ""
