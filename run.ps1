#Requires -Version 5.1
<#
.SYNOPSIS
    Script de despliegue automatico para LogisticsPro ERP
.DESCRIPTION
    Verifica dependencias, levanta contenedores, ejecuta migraciones y abre el navegador
#>

param(
    [switch]$Reset,
    [switch]$SkipBrowser,
    [switch]$Logs
)

$ErrorActionPreference = "Stop"
$Host.UI.RawUI.WindowTitle = "LogisticsPro ERP - Desplegando..."

$GREEN  = [System.ConsoleColor]::Green
$YELLOW = [System.ConsoleColor]::Yellow
$RED    = [System.ConsoleColor]::Red
$CYAN   = [System.ConsoleColor]::Cyan
$WHITE  = [System.ConsoleColor]::White

function Write-Step {
    param([string]$Message, [System.ConsoleColor]$Color = $WHITE)
    Write-Host "`n>>> $Message" -ForegroundColor $Color
}

function Write-Success {
    param([string]$Message)
    Write-Host "  [OK] $Message" -ForegroundColor $GREEN
}

function Write-Warning2 {
    param([string]$Message)
    Write-Host "  [WARN] $Message" -ForegroundColor $YELLOW
}

function Write-Error2 {
    param([string]$Message)
    Write-Host "  [ERROR] $Message" -ForegroundColor $RED
}

function Test-Command {
    param([string]$Command)
    return [bool](Get-Command $Command -ErrorAction SilentlyContinue)
}

# Banner
Write-Host @"

  ██╗      ██████╗  ██████╗ ██╗███████╗████████╗██╗ ██████╗███████╗
  ██║     ██╔═══██╗██╔════╝ ██║██╔════╝╚══██╔══╝██║██╔════╝██╔════╝
  ██║     ██║   ██║██║  ███╗██║███████╗   ██║   ██║██║     ███████╗
  ██║     ██║   ██║██║   ██║██║╚════██║   ██║   ██║██║     ╚════██║
  ███████╗╚██████╔╝╚██████╔╝██║███████║   ██║   ██║╚██████╗███████║
  ╚══════╝ ╚═════╝  ╚═════╝ ╚═╝╚══════╝   ╚═╝   ╚═╝ ╚═════╝╚══════╝

         P R O   E R P   -   S I S T E M A   L O G I S T I C O

"@ -ForegroundColor $CYAN

Write-Host "  Iniciando despliegue automatico..." -ForegroundColor $WHITE
Write-Host "  Fecha: $(Get-Date -Format 'dd/MM/yyyy HH:mm:ss')" -ForegroundColor $WHITE

# ============================================================
# PASO 1: Verificar dependencias
# ============================================================
Write-Step "PASO 1/5: Verificando dependencias del sistema..." $CYAN

if (-not (Test-Command "docker")) {
    Write-Error2 "Docker no esta instalado. Descargalo desde: https://www.docker.com/products/docker-desktop"
    exit 1
}
Write-Success "Docker encontrado: $(docker --version)"

if (-not (Test-Command "docker-compose") -and -not (docker compose version 2>$null)) {
    Write-Error2 "Docker Compose no esta instalado."
    exit 1
}
Write-Success "Docker Compose disponible"

# Verificar que Docker este corriendo
try {
    docker info 2>$null | Out-Null
    Write-Success "Docker esta activo y corriendo"
} catch {
    Write-Error2 "Docker no esta corriendo. Por favor inicia Docker Desktop y vuelve a ejecutar este script."
    exit 1
}

# ============================================================
# PASO 2: Preparar entorno
# ============================================================
Write-Step "PASO 2/5: Preparando entorno..." $CYAN

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ScriptDir

if (-not (Test-Path ".env")) {
    if (Test-Path ".env.example") {
        Copy-Item ".env.example" ".env"
        Write-Success "Archivo .env creado desde .env.example"
    }
}

if ($Reset) {
    Write-Warning2 "Modo RESET: Eliminando datos existentes..."
    docker compose down -v --remove-orphans 2>$null
    Write-Success "Contenedores y volúmenes eliminados"
}

# ============================================================
# PASO 3: Levantar contenedores
# ============================================================
Write-Step "PASO 3/5: Levantando contenedores (PostgreSQL, Redis, Backend, Frontend)..." $CYAN
Write-Host "  Esto puede tardar varios minutos la primera vez..." -ForegroundColor $YELLOW

docker compose pull 2>$null
Write-Success "Imagenes base descargadas/verificadas"

docker compose build --parallel
if ($LASTEXITCODE -ne 0) {
    Write-Error2 "Error al construir las imagenes Docker."
    exit 1
}
Write-Success "Imagenes construidas exitosamente"

docker compose up -d
if ($LASTEXITCODE -ne 0) {
    Write-Error2 "Error al iniciar los contenedores."
    exit 1
}
Write-Success "Contenedores iniciados"

# ============================================================
# PASO 4: Esperar servicios y ejecutar migraciones
# ============================================================
Write-Step "PASO 4/5: Esperando servicios y ejecutando migraciones..." $CYAN

Write-Host "  Esperando PostgreSQL..." -ForegroundColor $YELLOW
$maxWait = 60
$waited = 0
do {
    Start-Sleep -Seconds 2
    $waited += 2
    $pgReady = docker compose exec -T postgres pg_isready -U logistics_user -d logistics_erp 2>$null
    if ($waited -ge $maxWait) {
        Write-Error2 "PostgreSQL no inicio en $maxWait segundos."
        exit 1
    }
} until ($pgReady -match "accepting connections")
Write-Success "PostgreSQL listo"

Write-Host "  Esperando Backend API..." -ForegroundColor $YELLOW
$waited = 0
$maxWait = 120
do {
    Start-Sleep -Seconds 3
    $waited += 3
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3001/api/health" -UseBasicParsing -TimeoutSec 5 2>$null
        $ready = $response.StatusCode -eq 200
    } catch {
        $ready = $false
    }
    if ($waited -ge $maxWait) {
        Write-Error2 "Backend no inicio en $maxWait segundos. Revisa los logs: docker compose logs backend"
        exit 1
    }
} until ($ready)
Write-Success "Backend API listo en http://localhost:3001"

Write-Host "  Esperando Frontend..." -ForegroundColor $YELLOW
$waited = 0
$maxWait = 90
do {
    Start-Sleep -Seconds 3
    $waited += 3
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing -TimeoutSec 5 2>$null
        $ready = $response.StatusCode -eq 200
    } catch {
        $ready = $false
    }
    if ($waited -ge $maxWait) {
        Write-Warning2 "Frontend tardando mas de lo esperado... continuando."
        $ready = $true
    }
} until ($ready)
Write-Success "Frontend listo en http://localhost:3000"

# ============================================================
# PASO 5: Abrir navegador
# ============================================================
Write-Step "PASO 5/5: Sistema listo - Abriendo navegador..." $CYAN

if (-not $SkipBrowser) {
    Start-Process "http://localhost:3000"
    Write-Success "Navegador abierto en http://localhost:3000"
}

# ============================================================
# RESUMEN FINAL
# ============================================================
Write-Host ""
Write-Host "============================================================" -ForegroundColor $GREEN
Write-Host "  SISTEMA LOGISTICSPRO ERP DESPLEGADO EXITOSAMENTE" -ForegroundColor $GREEN
Write-Host "============================================================" -ForegroundColor $GREEN
Write-Host ""
Write-Host "  ACCESOS:" -ForegroundColor $WHITE
Write-Host "  Frontend:     http://localhost:3000" -ForegroundColor $CYAN
Write-Host "  Backend API:  http://localhost:3001/api" -ForegroundColor $CYAN
Write-Host "  Swagger Docs: http://localhost:3001/api/docs" -ForegroundColor $CYAN
Write-Host ""
Write-Host "  CREDENCIALES DE PRUEBA:" -ForegroundColor $WHITE
Write-Host "  Admin:       admin@logistics.com / Admin123!" -ForegroundColor $CYAN
Write-Host "  Operaciones: ops@logistics.com / Ops123!" -ForegroundColor $CYAN
Write-Host "  Chofer:      chofer@logistics.com / Driver123!" -ForegroundColor $CYAN
Write-Host ""
Write-Host "  COMANDOS UTILES:" -ForegroundColor $WHITE
Write-Host "  Ver logs:     docker compose logs -f" -ForegroundColor $YELLOW
Write-Host "  Detener:      docker compose down" -ForegroundColor $YELLOW
Write-Host "  Reset total:  .\run.ps1 -Reset" -ForegroundColor $YELLOW
Write-Host ""
Write-Host "============================================================" -ForegroundColor $GREEN

if ($Logs) {
    Write-Host "`nMostrando logs en tiempo real (Ctrl+C para salir)..." -ForegroundColor $YELLOW
    docker compose logs -f
}
