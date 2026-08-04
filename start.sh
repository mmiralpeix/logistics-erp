#!/bin/sh
set -e

echo "========================================="
echo "  LogisticsPro ERP - Railway Start"
echo "========================================="

# 1. Run Prisma DB push to sync schema
echo "🔧 Syncing database schema with Prisma..."
cd backend && npx prisma db push --accept-data-loss
cd ..

# 2. Start Backend NestJS on port 3001 (internal)
echo "🚀 Starting Backend NestJS on port 3001..."
cd backend
BACKEND_PORT=3001 node dist/src/main.js &
BACKEND_PID=$!
cd ..

# Wait for backend to be ready
echo "⏳ Waiting for backend to start..."
sleep 3

# 3. Prepare and start Frontend Next.js on Railway's PORT (public)
echo "🌐 Preparing Frontend Next.js standalone..."
cp -r frontend/.next/static frontend/.next/standalone/.next/static 2>/dev/null || true
cp -r frontend/public frontend/.next/standalone/public 2>/dev/null || true

echo "🌐 Starting Frontend Next.js on port ${PORT:-3000}..."
cd frontend/.next/standalone
BACKEND_INTERNAL_URL="http://localhost:3001/api" \
NEXT_PUBLIC_API_URL="http://localhost:3001/api" \
HOSTNAME="0.0.0.0" \
PORT="${PORT:-3000}" \
node server.js
