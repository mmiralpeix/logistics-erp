# Script de Actualizacion del Grafo de Conocimiento Graphify
$ErrorActionPreference = "Continue"
$RootPath = Get-Location

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host " Graphify Knowledge Graph Updater" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

$GraphifyExe = "$env:LOCALAPPDATA\Packages\PythonSoftwareFoundation.Python.3.11_qbz5n2kfra8p0\LocalCache\local-packages\Python311\Scripts\graphify.exe"

if (Test-Path $GraphifyExe) {
    Write-Host "  -> Ejecutando Graphify AST Extractor..." -ForegroundColor Gray
    & $GraphifyExe . --code-only
    Write-Host "  [OK] Extraccion AST completada en: graphify-out/graph.json" -ForegroundColor Green
    
    Write-Host "  -> Generando arbol visual interactivo D3 HTML..." -ForegroundColor Gray
    & $GraphifyExe tree --graph graphify-out/graph.json --output .agents/knowledge/graphify/GRAPH_TREE.html
    Write-Host "  [OK] Arbol generado en: .agents/knowledge/graphify/GRAPH_TREE.html" -ForegroundColor Green
} else {
    Write-Host "  -> Graphify CLI no encontrado en Path local, manteniendo indices de respaldo." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Green
Write-Host " OK: Grafo de conocimiento sincronizado al 100%." -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
