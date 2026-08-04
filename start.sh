#!/bin/sh
set -e

echo "========================================="
echo "  LogisticsPro ERP - Railway Start"
echo "  SERVICE_ROLE: ${SERVICE_ROLE:-auto-detect}"
echo "========================================="

# Auto-detect role if not set: if backend/dist exists and no frontend build, assume backend
if [ -z "$SERVICE_ROLE" ]; then
  if [ "$PORT" = "3001" ]; then
    SERVICE_ROLE="backend"
  else
    SERVICE_ROLE="frontend"
  fi
  echo "⚡ Auto-detected SERVICE_ROLE=$SERVICE_ROLE (based on PORT=$PORT)"
fi

if [ "$SERVICE_ROLE" = "backend" ]; then
  echo "🔧 Syncing database schema with Prisma..."
  cd backend && npx prisma db push --accept-data-loss

  echo "🚀 Starting Backend NestJS on port ${PORT:-3001}..."
  node dist/src/main.js

elif [ "$SERVICE_ROLE" = "frontend" ]; then
  echo "🌐 Preparing Frontend Next.js standalone..."
  cp -r frontend/.next/static frontend/.next/standalone/.next/static 2>/dev/null || true
  cp -r frontend/public frontend/.next/standalone/public 2>/dev/null || true

  echo "🌐 Starting Frontend Next.js on port ${PORT:-3000}..."
  cd frontend/.next/standalone
  HOSTNAME="0.0.0.0" node server.js

else
  echo "❌ Unknown SERVICE_ROLE: $SERVICE_ROLE"
  echo "   Set SERVICE_ROLE=backend or SERVICE_ROLE=frontend in Railway env vars"
  exit 1
fi
