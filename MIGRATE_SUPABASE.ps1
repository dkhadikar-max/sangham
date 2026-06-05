# Sangham -- Push Prisma schema to Supabase
# Run from: C:\Sangham\sangham-backend-src\
# Requires: Node.js installed, .env already configured

Write-Host ""
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host "  Sangham -- Supabase DB Migration"     -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host ""

# Verify .env exists
if (-not (Test-Path ".env")) {
    Write-Host "ERROR: .env not found. Run from sangham-backend-src\" -ForegroundColor Red
    exit 1
}

# Check .env has real values (not placeholders)
$envContent = Get-Content ".env" -Raw
if ($envContent -match "\[PROJECT-REF\]" -or $envContent -match "\[PASSWORD\]") {
    Write-Host "ERROR: .env still has placeholder values. Fill in DATABASE_URL and DIRECT_URL first." -ForegroundColor Red
    exit 1
}

Write-Host "[1/2] Pushing schema to Supabase..." -ForegroundColor Yellow
Write-Host "      This syncs schema.prisma to the database." -ForegroundColor Gray
Write-Host ""

npx prisma db push

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "ERROR: db push failed. Common fixes:" -ForegroundColor Red
    Write-Host "  - Password with special chars (@ etc) must be URL-encoded in .env" -ForegroundColor White
    Write-Host "  - Check your Supabase project is not paused (free tier auto-pauses)" -ForegroundColor White
    Write-Host "  - Verify project ref in the URLs matches your Supabase dashboard" -ForegroundColor White
    exit 1
}

Write-Host ""
Write-Host "[2/2] Generating Prisma client..." -ForegroundColor Yellow
npx prisma generate

if ($LASTEXITCODE -ne 0) {
    Write-Host "WARNING: Client generation failed -- run 'npx prisma generate' manually." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=======================================" -ForegroundColor Green
Write-Host "  Schema pushed to Supabase!"           -ForegroundColor Green
Write-Host "=======================================" -ForegroundColor Green
Write-Host ""
Write-Host "  Next steps:" -ForegroundColor Cyan
Write-Host "    npm run dev" -ForegroundColor White
Write-Host "    http://localhost:4000/health" -ForegroundColor White
Write-Host "    npx prisma studio  -- browse your DB" -ForegroundColor White
Write-Host ""
