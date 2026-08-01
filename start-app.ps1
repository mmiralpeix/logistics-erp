# LogisticsPro ERP - Iniciador completo (Backend, Frontend y Graphify)
param(
    [switch]$Restart,
    [switch]$CleanCache
)

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " LogisticsPro ERP - Iniciando Entorno de Desarrollo" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

$root = $PSScriptRoot
if (-not $root) { $root = Split-Path -Parent $MyInvocation.MyCommand.Path }

function Kill-PortProcess {
    param([int]$Port)
    try {
        $conns = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
        foreach ($conn in $conns) {
            if ($conn.OwningProcess -gt 0) {
                Write-Host "  -> Deteniendo proceso zombie en puerto $Port (PID $($conn.OwningProcess))..." -ForegroundColor Yellow
                Stop-Process -Id $conn.OwningProcess -Force -ErrorAction SilentlyContinue
            }
        }
    } catch {}
}

function Test-HttpOk {
    param([string]$Url)
    try {
        $req = [System.Net.WebRequest]::Create($Url)
        $req.Timeout = 3000
        $res = $req.GetResponse()
        $status = [int]$res.StatusCode
        $res.Close()
        return ($status -ge 200 -and $status -lt 400)
    } catch {
        return $false
    }
}

if ($Restart -or $CleanCache) {
    Write-Host "  -> Reiniciando todos los procesos..." -ForegroundColor Yellow
    Kill-PortProcess -Port 3000
    Kill-PortProcess -Port 3001
    Kill-PortProcess -Port 3333
    Start-Sleep -Seconds 1
}

if ($CleanCache) {
    Write-Host "  -> Limpiando caché de Next.js (.next)..." -ForegroundColor Yellow
    if (Test-Path "$root\frontend\.next") {
        Remove-Item -Recurse -Force "$root\frontend\.next" -ErrorAction SilentlyContinue
    }
}

# 1. Graphify Server (Puerto 3333)
if ((Test-HttpOk -Url "http://localhost:3333")) {
    Write-Host "  [OK] Graphify Server ya activo en puerto 3333" -ForegroundColor Green
} else {
    Kill-PortProcess -Port 3333
    Write-Host "  -> Iniciando Graphify Server (puerto 3333)..." -ForegroundColor Yellow
    Start-Process cmd.exe -ArgumentList "/c node .agents/knowledge/graphify/serve.js" -WorkingDirectory "$root" -WindowStyle Minimized
}

# 2. Backend (Puerto 3001)
if ((Test-HttpOk -Url "http://localhost:3001/api/health")) {
    Write-Host "  [OK] Backend API ya activo en puerto 3001" -ForegroundColor Green
} else {
    Kill-PortProcess -Port 3001
    Write-Host "  -> Iniciando Backend API (puerto 3001)..." -ForegroundColor Yellow
    Start-Process cmd.exe -ArgumentList "/c npm run start:dev" -WorkingDirectory "$root\backend" -WindowStyle Minimized
}

# 3. Esperar Backend
Write-Host "  -> Verificando Backend API..." -ForegroundColor Gray
$readyBackend = $false
for ($i = 0; $i -lt 30; $i++) {
    if (Test-HttpOk -Url "http://localhost:3001/api/health") { $readyBackend = $true; break }
    Start-Sleep -Seconds 1
}
if ($readyBackend) {
    Write-Host "  [OK] Backend listo en http://localhost:3001/api" -ForegroundColor Green
} else {
    Write-Host "  [WARN] Backend aún no respondió 200 OK, continuando..." -ForegroundColor Yellow
}

# 4. Frontend (Puerto 3000)
if ((Test-HttpOk -Url "http://localhost:3000")) {
    Write-Host "  [OK] Frontend ya activo en puerto 3000" -ForegroundColor Green
} else {
    Kill-PortProcess -Port 3000
    Write-Host "  -> Iniciando Frontend Next.js (puerto 3000)..." -ForegroundColor Yellow
    Start-Process cmd.exe -ArgumentList "/c npm run dev" -WorkingDirectory "$root\frontend" -WindowStyle Minimized
}

# 5. Esperar Frontend
Write-Host "  -> Verificando Frontend..." -ForegroundColor Gray
$readyFrontend = $false
for ($i = 0; $i -lt 30; $i++) {
    if (Test-HttpOk -Url "http://localhost:3000") { $readyFrontend = $true; break }
    Start-Sleep -Seconds 1
}
if ($readyFrontend) {
    Write-Host "  [OK] Frontend listo en http://localhost:3000" -ForegroundColor Green
} else {
    Write-Host "  [WARN] Frontend compilando o iniciando..." -ForegroundColor Yellow
}

# 6. Abrir navegadores
Write-Host "  -> Abriendo servicios en el navegador..." -ForegroundColor Cyan
Start-Process "http://localhost:3000"

Write-Host "==========================================================" -ForegroundColor Green
Write-Host " OK: Servicios de LogisticsPro ERP verificados!" -ForegroundColor Green
Write-Host " - Frontend:  http://localhost:3000" -ForegroundColor Cyan
Write-Host " - Backend:   http://localhost:3001/api" -ForegroundColor Cyan
Write-Host " - Graphify:  http://localhost:3333" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Green

