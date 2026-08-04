# Multi-stage Dockerfile for NestJS Backend
FROM node:20-alpine AS builder

WORKDIR /app

RUN apk add --no-cache openssl

COPY backend/package*.json ./
RUN npm install --legacy-peer-deps

COPY backend/ ./
RUN npx prisma generate
RUN npm run build

# ---- Production image ----
FROM node:20-alpine AS production

WORKDIR /app

RUN apk add --no-cache openssl curl

COPY backend/package*.json ./
RUN npm install --only=production --legacy-peer-deps

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY backend/prisma ./prisma

RUN mkdir -p uploads

ENV PORT=3001
ENV NODE_ENV=production

EXPOSE 3001

CMD ["sh", "-c", "npx prisma db push --accept-data-loss --schema=./prisma/schema.prisma && node dist/src/main.js"]
