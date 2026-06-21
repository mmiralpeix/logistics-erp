#!/usr/bin/env bash
set -euo pipefail

# ============================================================
# LogisticsPro ERP - Script de despliegue automatico
# Compatible con Linux y macOS
# ============================================================

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

RESET=false
SKIP_BROWSER=false
SHOW_LOGS=false

for arg in "$@"; do
    case $arg in
        --reset) RESET=true ;;
        --skip-browser) SKIP_BROWSER=true ;;
        --logs) SHOW_LOGS=true ;;
    esac
done

step() { echo -e "\n${CYAN}>>> $1${NC}"; }
ok()   { echo -e "  ${GREEN}[OK]${NC} $1"; }
warn() { echo -e "  ${YELLOW}[WARN]${NC} $1"; }
err()  { echo -e "  ${RED}[ERROR]${NC} $1"; exit 1; }

echo -e "${CYAN}"
cat << 'EOF'
  ██╗      ██████╗  ██████╗ ██╗███████╗████████╗██╗ ██████╗███████╗
  ██║     ██╔═══██╗██╔════╝ ██║██╔════╝╚══██╔══╝██║██╔════╝██╔════╝
  ██║     ██║   ██║██║  ███╗██║███████╗   ██║   ██║██║     ███████╗
  ██║     ██║   ██║██║   ██║██║╚════██║   ██║   ██║██║     ╚════██║
  ███████╗╚██████╔╝╚██████╔╝██║███████║   ██║   ██║╚██████╗███████║
  ╚══════╝ ╚═════╝  ╚═════╝ ╚═╝╚══════╝   ╚═╝   ╚═╝ ╚═════╝╚══════╝

         P R O   E R P   -   S I S T E M A   L O G I S T I C O
EOF
echo -e "${NC}"
echo -e "  Iniciando despliegue automatico..."
echo -e "  Fecha: $(date '+%d/%m/%Y %H:%M:%S')"

# PASO 1: Verificar dependencias
step "PASO 1/5: Verificando dependencias del sistema..."

command -v docker &>/dev/null || err "Docker no esta instalado. Visita: https://docs.docker.com/get-docker/"
ok "Docker encontrado: $(docker --version)"

(docker compose version &>/dev/null || docker-compose --version &>/dev/null) || err "Docker Compose no esta instalado."
ok "Docker Compose disponible"

docker info &>/dev/null || err "Docker no esta corriendo. Inicia Docker y vuelve a ejecutar."
ok "Docker esta activo"

# PASO 2: Preparar entorno
step "PASO 2/5: Preparando entorno..."

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

[[ ! -f ".env" && -f ".env.example" ]] && cp ".env.example" ".env" && ok "Archivo .env creado"

if [[ "$RESET" == true ]]; then
    warn "Modo RESET: Eliminando datos existentes..."
    docker compose down -v --remove-orphans 2>/dev/null || true
    ok "Contenedores y volumenes eliminados"
fi

mkdir -p backend/uploads

# PASO 3: Levantar contenedores
step "PASO 3/5: Levantando contenedores..."
echo -e "  ${YELLOW}Esto puede tardar varios minutos la primera vez...${NC}"

docker compose pull --quiet 2>/dev/null || true
ok "Imagenes base verificadas"

docker compose build --parallel
ok "Imagenes construidas"

docker compose up -d
ok "Contenedores iniciados"

# PASO 4: Esperar servicios
step "PASO 4/5: Esperando servicios y migraciones..."

echo -e "  ${YELLOW}Esperando PostgreSQL...${NC}"
MAX_WAIT=60; WAITED=0
until docker compose exec -T postgres pg_isready -U logistics_user -d logistics_erp &>/dev/null; do
    sleep 2; WAITED=$((WAITED+2))
    [[ $WAITED -ge $MAX_WAIT ]] && err "PostgreSQL no inicio en ${MAX_WAIT}s"
done
ok "PostgreSQL listo"

echo -e "  ${YELLOW}Esperando Backend API...${NC}"
MAX_WAIT=120; WAITED=0
until curl -sf http://localhost:3001/api/health &>/dev/null; do
    sleep 3; WAITED=$((WAITED+3))
    [[ $WAITED -ge $MAX_WAIT ]] && err "Backend no inicio. Revisa: docker compose logs backend"
done
ok "Backend API listo en http://localhost:3001"

echo -e "  ${YELLOW}Esperando Frontend...${NC}"
MAX_WAIT=90; WAITED=0
until curl -sf http://localhost:3000 &>/dev/null; do
    sleep 3; WAITED=$((WAITED+3))
    [[ $WAITED -ge $MAX_WAIT ]] && { warn "Frontend tardando... continuando."; break; }
done
ok "Frontend listo en http://localhost:3000"

# PASO 5: Abrir navegador
step "PASO 5/5: Sistema listo..."

if [[ "$SKIP_BROWSER" == false ]]; then
    if command -v xdg-open &>/dev/null; then
        xdg-open "http://localhost:3000" &>/dev/null &
    elif command -v open &>/dev/null; then
        open "http://localhost:3000"
    fi
    ok "Navegador abierto"
fi

echo -e "\n${GREEN}============================================================${NC}"
echo -e "${GREEN}  SISTEMA LOGISTICSPRO ERP DESPLEGADO EXITOSAMENTE${NC}"
echo -e "${GREEN}============================================================${NC}"
echo ""
echo -e "  ${NC}ACCESOS:"
echo -e "  ${CYAN}Frontend:     http://localhost:3000${NC}"
echo -e "  ${CYAN}Backend API:  http://localhost:3001/api${NC}"
echo -e "  ${CYAN}Swagger Docs: http://localhost:3001/api/docs${NC}"
echo ""
echo -e "  CREDENCIALES DE PRUEBA:"
echo -e "  ${CYAN}Admin:       admin@logistics.com / Admin123!${NC}"
echo -e "  ${CYAN}Operaciones: ops@logistics.com / Ops123!${NC}"
echo -e "  ${CYAN}Chofer:      chofer@logistics.com / Driver123!${NC}"
echo ""
echo -e "  COMANDOS UTILES:"
echo -e "  ${YELLOW}Ver logs:     docker compose logs -f${NC}"
echo -e "  ${YELLOW}Detener:      docker compose down${NC}"
echo -e "  ${YELLOW}Reset total:  ./run.sh --reset${NC}"
echo -e "${GREEN}============================================================${NC}"

[[ "$SHOW_LOGS" == true ]] && docker compose logs -f
