# LogisticsPro ERP - Iniciador completo (Backend, Frontend y Graphify)
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " LogisticsPro ERP - Iniciando Entorno de Desarrollo" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

$root = $PSScriptRoot
if (-not $root) { $root = Split-Path -Parent $MyInvocation.MyCommand.Path }

function Test-PortActive {
    param([int]$Port)
    try {
        $conn = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
        return ($null -ne $conn)
    } catch {
        return $false
    }
}

# 1. Graphify Server (Puerto 3333)
if (Test-PortActive -Port 3333) {
    Write-Host "  [OK] Graphify Server ya activo en puerto 3333" -ForegroundColor Green
} else {
    Write-Host "  -> Iniciando Graphify Server (puerto 3333)..." -ForegroundColor Yellow
    $graphCmd = "cd /d `"$root`" && node .agents/knowledge/graphify/serve.js"
    Start-Process cmd.exe -ArgumentList "/c start /min cmd.exe /c `"$graphCmd`"" -WindowStyle Hidden
}

# 2. Backend (Puerto 3001)
if (Test-PortActive -Port 3001) {
    Write-Host "  [OK] Backend API ya activo en puerto 3001" -ForegroundColor Green
} else {
    Write-Host "  -> Iniciando Backend API (puerto 3001)..." -ForegroundColor Yellow
    $backendCmd = "cd /d `"$root\backend`" && npm.cmd run start:dev"
    Start-Process cmd.exe -ArgumentList "/c start /min cmd.exe /c `"$backendCmd`"" -WindowStyle Hidden
}

# 3. Esperar Backend
Write-Host "  -> Verificando Backend API..." -ForegroundColor Gray
$ready = $false
for ($i = 0; $i -lt 30; $i++) {
    if (Test-PortActive -Port 3001) { $ready = $true; break }
    Start-Sleep -Seconds 2
}
if ($ready) {
    Write-Host "  [OK] Backend listo en http://localhost:3001/api" -ForegroundColor Green
} else {
    Write-Host "  [WARN] Backend no respondió aún en puerto 3001, continuando..." -ForegroundColor Yellow
}

# 4. Frontend (Puerto 3000)
if (Test-PortActive -Port 3000) {
    Write-Host "  [OK] Frontend ya activo en puerto 3000" -ForegroundColor Green
} else {
    Write-Host "  -> Iniciando Frontend Next.js (puerto 3000)..." -ForegroundColor Yellow
    $frontendCmd = "cd /d `"$root\frontend`" && npm.cmd run dev"
    Start-Process cmd.exe -ArgumentList "/c start /min cmd.exe /c `"$frontendCmd`"" -WindowStyle Hidden
}

# 5. Esperar Frontend
Write-Host "  -> Verificando Frontend..." -ForegroundColor Gray
$ready = $false
for ($i = 0; $i -lt 30; $i++) {
    if (Test-PortActive -Port 3000) { $ready = $true; break }
    Start-Sleep -Seconds 2
}
if ($ready) {
    Write-Host "  [OK] Frontend listo en http://localhost:3000" -ForegroundColor Green
} else {
    Write-Host "  [WARN] Frontend no respondió aún en puerto 3000, continuando..." -ForegroundColor Yellow
}

# 6. Abrir navegadores
Write-Host "  -> Abriendo servicios en el navegador..." -ForegroundColor Cyan
Start-Process "http://localhost:3000"
Start-Process "http://localhost:3333/GRAPH_TREE.html"

if (Test-Path "$root\node_modules\electron\dist\electron.exe") {
    Start-Process "$root\node_modules\electron\dist\electron.exe" -ArgumentList "."
}

Write-Host "==========================================================" -ForegroundColor Green
Write-Host " OK: Todos los servicios de LogisticsPro ERP están activos!" -ForegroundColor Green
Write-Host " - Frontend:  http://localhost:3000" -ForegroundColor Cyan
Write-Host " - Backend:   http://localhost:3001/api" -ForegroundColor Cyan
Write-Host " - Graphify:  http://localhost:3333" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Green
