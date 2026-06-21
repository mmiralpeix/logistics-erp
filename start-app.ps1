# LogisticsPro ERP — Iniciador completo
Write-Host "`n🚛 LogisticsPro ERP — Iniciando...`n" -ForegroundColor Cyan

$root = Split-Path -Parent $MyInvocation.MyCommand.Path

# 1. Backend
Write-Host "▶ Iniciando Backend (puerto 3001)..." -ForegroundColor Yellow
$backend = Start-Process powershell -ArgumentList "-NoExit", "-Command", `
  "Set-Location '$root\backend'; `$env:DATABASE_URL='postgresql://logistics_user:logistics_pass_2024@localhost:5432/logistics_erp'; npm run start:dev" `
  -PassThru -WindowStyle Minimized

# 2. Esperar que el backend esté listo
Write-Host "⏳ Esperando Backend..." -ForegroundColor Gray
$ready = $false
for ($i = 0; $i -lt 60; $i++) {
    Start-Sleep -Seconds 2
    try {
        $r = Invoke-WebRequest -Uri "http://localhost:3001/api/health" -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop
        if ($r.StatusCode -eq 200) { $ready = $true; break }
    } catch {}
    Write-Host "  Intento $($i+1)/30..." -ForegroundColor DarkGray
}

if (-not $ready) {
    Write-Host "❌ El backend no respondió. Revisá los logs." -ForegroundColor Red
    exit 1
}
Write-Host "✅ Backend listo!" -ForegroundColor Green

# 3. Frontend
Write-Host "▶ Iniciando Frontend (puerto 3000)..." -ForegroundColor Yellow
$frontend = Start-Process powershell -ArgumentList "-NoExit", "-Command", `
  "Set-Location '$root\frontend'; npm run dev" `
  -PassThru -WindowStyle Minimized

# 4. Esperar que el frontend esté listo
Write-Host "⏳ Esperando Frontend..." -ForegroundColor Gray
$ready = $false
for ($i = 0; $i -lt 30; $i++) {
    Start-Sleep -Seconds 2
    try {
        $r = Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop
        if ($r.StatusCode -eq 200) { $ready = $true; break }
    } catch {}
    Write-Host "  Intento $($i+1)/15..." -ForegroundColor DarkGray
}

if (-not $ready) {
    Write-Host "❌ El frontend no respondió." -ForegroundColor Red
    exit 1
}
Write-Host "✅ Frontend listo!" -ForegroundColor Green

# 5. Lanzar Electron
Write-Host "`n🖥️  Abriendo LogisticsPro ERP...`n" -ForegroundColor Cyan
Set-Location $root
& ".\node_modules\electron\dist\electron.exe" .
