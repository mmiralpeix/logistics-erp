# LogisticsPro ERP - Iniciador completo
Write-Host "LogisticsPro ERP - Iniciando..." -ForegroundColor Cyan

$root = $PSScriptRoot
if (-not $root) { $root = Split-Path -Parent $MyInvocation.MyCommand.Path }

# 1. Backend
Write-Host "Iniciando Backend (puerto 3001)..." -ForegroundColor Yellow
$backendCmd = "cd '$root\backend' && npm run start:dev"
$backend = Start-Process cmd.exe -ArgumentList "/c", $backendCmd -PassThru -WindowStyle Minimized

# 2. Esperar que el backend este listo
Write-Host "Esperando Backend..." -ForegroundColor Gray
$ready = $false
for ($i = 0; $i -lt 60; $i++) {
    Start-Sleep -Seconds 2
    try {
        $r = Invoke-WebRequest -Uri "http://localhost:3001/api/health" -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop
        if ($r.StatusCode -eq 200) { $ready = $true; break }
    } catch {}
    Write-Host "  Intento $($i+1)/60..." -ForegroundColor DarkGray
}

if (-not $ready) {
    Write-Host "El backend no respondio. Revisa los logs." -ForegroundColor Red
    exit 1
}
Write-Host "Backend listo!" -ForegroundColor Green

# 3. Frontend
Write-Host "Iniciando Frontend (puerto 3000)..." -ForegroundColor Yellow
$frontendCmd = "cd '$root\frontend' && npm run dev"
$frontend = Start-Process cmd.exe -ArgumentList "/c", $frontendCmd -PassThru -WindowStyle Minimized

# 4. Esperar que el frontend este listo
Write-Host "Esperando Frontend..." -ForegroundColor Gray
$ready = $false
for ($i = 0; $i -lt 30; $i++) {
    Start-Sleep -Seconds 2
    try {
        $r = Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop
        if ($r.StatusCode -eq 200) { $ready = $true; break }
    } catch {}
    Write-Host "  Intento $($i+1)/30..." -ForegroundColor DarkGray
}

if (-not $ready) {
    Write-Host "El frontend no respondio." -ForegroundColor Red
    exit 1
}
Write-Host "Frontend listo!" -ForegroundColor Green

# 5. Lanzar Electron o abrir navegador
Write-Host "Abriendo LogisticsPro ERP..." -ForegroundColor Cyan
Set-Location $root
Start-Process "http://localhost:3000"
if (Test-Path ".\node_modules\electron\dist\electron.exe") {
    Start-Process ".\node_modules\electron\dist\electron.exe" -ArgumentList "."
}
