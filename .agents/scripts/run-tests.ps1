# Script de Verificación y Testing Automatizado para el Sistema Agéntico
param (
    [switch]$BackendOnly,
    [switch]$FrontendOnly,
    [switch]$SkipLint
)

$ErrorActionPreference = "Continue"
$RootPath = Get-Location

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host " Agentic Test Verification Suite" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

$hasErrors = $false

# 1. Backend Verification
if (-not $FrontendOnly) {
    Write-Host ""
    Write-Host "[1/2] Verificando Backend (NestJS)..." -ForegroundColor Yellow
    Set-Location "$RootPath\backend"

    Write-Host "  -> Ejecutando TypeCheck TypeScript en Backend..." -ForegroundColor Gray
    npx tsc --noEmit
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  [X] Backend TypeCheck FAILED" -ForegroundColor Red
        $hasErrors = $true
    } else {
        Write-Host "  [OK] Backend TypeCheck PASSED" -ForegroundColor Green
    }
}

# 2. Frontend Verification
if (-not $BackendOnly) {
    Write-Host ""
    Write-Host "[2/2] Verificando Frontend (Next.js)..." -ForegroundColor Yellow
    Set-Location "$RootPath\frontend"

    Write-Host "  -> Ejecutando TypeCheck TypeScript en Frontend..." -ForegroundColor Gray
    npx tsc --noEmit
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  [X] Frontend TypeCheck FAILED" -ForegroundColor Red
        $hasErrors = $true
    } else {
        Write-Host "  [OK] Frontend TypeCheck PASSED" -ForegroundColor Green
    }

    if (-not $SkipLint) {
        Write-Host "  -> Ejecutando ESLint en Frontend..." -ForegroundColor Gray
        npm run lint
        if ($LASTEXITCODE -ne 0) {
            Write-Host "  [X] Frontend ESLint FAILED" -ForegroundColor Red
            $hasErrors = $true
        } else {
            Write-Host "  [OK] Frontend ESLint PASSED" -ForegroundColor Green
        }
    }
}

Set-Location $RootPath

Write-Host ""
if ($hasErrors) {
    Write-Host "==========================================" -ForegroundColor Red
    Write-Host " ERROR: Verificacion Fallida. Revisar errores arriba." -ForegroundColor Red
    Write-Host "==========================================" -ForegroundColor Red
    exit 1
} else {
    Write-Host "==========================================" -ForegroundColor Green
    Write-Host " OK: Todas las verificaciones PASARON." -ForegroundColor Green
    Write-Host "==========================================" -ForegroundColor Green
    exit 0
}
