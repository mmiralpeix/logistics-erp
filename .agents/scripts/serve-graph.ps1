# Script para Servir el Visualizador del Grafo en Localhost (http://localhost:3333)
$ErrorActionPreference = "Continue"
$RootPath = Get-Location

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host " 🌐 Servidor Local del Grafo Graphify" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

$GraphHtml = "$RootPath\.agents\knowledge\graphify\GRAPH_TREE.html"

if (-not (Test-Path $GraphHtml)) {
    Write-Host "  -> El grafico HTML no existe aun. Generando..." -ForegroundColor Yellow
    npm run index
}

$ts = [DateTimeOffset]::Now.ToUnixTimeSeconds()
Write-Host "  -> Abriendo el navegador en: http://localhost:3333/GRAPH_TREE.html?v=$ts" -ForegroundColor Green
Start-Process "http://localhost:3333/GRAPH_TREE.html?v=$ts"

Write-Host "  -> Servidor activo en el puerto 3333 (Node.js High Performance). Presione Ctrl+C para detener." -ForegroundColor Gray
node "$RootPath\.agents\knowledge\graphify\serve.js"
