#!/usr/bin/env bash
# ============================================================
# LogisticsPro ERP — Kubernetes Deployment Script
# Usage: ./k8s/deploy.sh [staging|production] [image-tag]
# ============================================================

set -euo pipefail

ENVIRONMENT="${1:-staging}"
IMAGE_TAG="${2:-latest}"
NAMESPACE="logistics-erp"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}"
echo "╔══════════════════════════════════════════════╗"
echo "║      LogisticsPro ERP — Kubernetes Deploy    ║"
echo "╚══════════════════════════════════════════════╝"
echo -e "${NC}"
echo -e "Environment: ${YELLOW}${ENVIRONMENT}${NC}"
echo -e "Image tag:   ${YELLOW}${IMAGE_TAG}${NC}"
echo ""

# ── Prerequisite checks ──────────────────────────────────────
command -v kubectl &>/dev/null || { echo -e "${RED}kubectl not found${NC}"; exit 1; }
command -v kustomize &>/dev/null || { echo -e "${RED}kustomize not found${NC}"; exit 1; }

kubectl cluster-info &>/dev/null || { echo -e "${RED}Cannot connect to Kubernetes cluster${NC}"; exit 1; }
echo -e "${GREEN}✓ Kubernetes cluster reachable${NC}"

# ── Create namespace if it doesn't exist ─────────────────────
kubectl get namespace "$NAMESPACE" &>/dev/null || {
  echo "Creating namespace ${NAMESPACE}..."
  kubectl apply -f k8s/namespace.yaml
}

# ── Apply ConfigMap and Secrets ──────────────────────────────
echo "Applying configuration..."
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secrets.yaml

# ── Update image tags ─────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

kustomize edit set image \
  logistics-erp-backend=logistics-erp-backend:"${IMAGE_TAG}" \
  logistics-erp-frontend=logistics-erp-frontend:"${IMAGE_TAG}"

# ── Deploy infrastructure (postgres, redis) ──────────────────
echo "Deploying infrastructure..."
kubectl apply -f k8s/postgres.yaml
kubectl apply -f k8s/redis.yaml

echo "Waiting for PostgreSQL to be ready..."
kubectl rollout status deployment/postgres -n "$NAMESPACE" --timeout=120s

echo "Waiting for Redis to be ready..."
kubectl rollout status deployment/redis -n "$NAMESPACE" --timeout=60s

# ── Deploy applications ───────────────────────────────────────
echo "Deploying backend..."
kubectl apply -f k8s/backend.yaml
kubectl rollout status deployment/backend -n "$NAMESPACE" --timeout=300s

echo "Deploying frontend..."
kubectl apply -f k8s/frontend.yaml
kubectl rollout status deployment/frontend -n "$NAMESPACE" --timeout=120s

# ── Apply ingress ─────────────────────────────────────────────
kubectl apply -f k8s/ingress.yaml

# ── Status summary ────────────────────────────────────────────
echo ""
echo -e "${GREEN}══════════════════════════════════════${NC}"
echo -e "${GREEN}  Deployment completed successfully!  ${NC}"
echo -e "${GREEN}══════════════════════════════════════${NC}"
echo ""
echo "Pods running in ${NAMESPACE}:"
kubectl get pods -n "$NAMESPACE"
echo ""
echo "Services:"
kubectl get services -n "$NAMESPACE"
echo ""
echo -e "Access the app via your Ingress or: ${BLUE}kubectl port-forward svc/frontend-service 3000:3000 -n ${NAMESPACE}${NC}"
