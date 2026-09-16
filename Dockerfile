# Parkmind — production image
FROM node:20-slim AS base
WORKDIR /app
ENV NODE_ENV=production
# OpenSSL is required by Prisma's query engine.
RUN apt-get update -y && apt-get install -y openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

# ── Dependencies ─────────────────────────────────────────────────────────────
FROM base AS deps
COPY package.json package-lock.json* ./
COPY prisma ./prisma
RUN npm ci

# ── Build ────────────────────────────────────────────────────────────────────
FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# ── Runtime ──────────────────────────────────────────────────────────────────
FROM base AS run
ENV PORT=3000
COPY --from=build /app ./
EXPOSE 3000
# Apply migrations then start the server.
CMD ["sh", "-c", "npx prisma migrate deploy && npm run start"]
