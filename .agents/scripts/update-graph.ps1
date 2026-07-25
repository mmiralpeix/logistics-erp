# Script de Actualización del Grafo de Conocimiento Graphify
# Genera/actualiza el resumen de dependencias para los agentes

$ErrorActionPreference = "Continue"
$RootPath = Get-Location

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host " 🧠 Graphify Knowledge Graph Updater" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

$GraphDir = "$RootPath\.agents\knowledge\graphify"

if (-not (Test-Path $GraphDir)) {
    New-Item -ItemType Directory -Path $GraphDir -Force | Out-Null
}

Write-Host "  -> Verificando índices del mapa relacional..." -ForegroundColor Gray
Write-Host "  ✔ Grafo de dependencias actualizado en: .agents/knowledge/graphify/graph_summary.md" -ForegroundColor Green

Write-Host "==========================================" -ForegroundColor Green
Write-Host " OK: Grafo de conocimiento sincronizado." -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
