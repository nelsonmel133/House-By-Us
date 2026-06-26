# ── Stage 1: Install dependencies ────────────────────────────────────────────
FROM node:20-alpine AS deps

# pnpm via corepack (built into Node 20)
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy workspace manifests first for layer caching
COPY pnpm-workspace.yaml .npmrc package.json pnpm-lock.yaml* ./
COPY backend/package.json ./backend/package.json
COPY backend/server/package.json ./backend/server/package.json
COPY backend/drizzle/package.json ./backend/drizzle/package.json
COPY backend/shared/package.json ./backend/shared/package.json

# Install all workspace deps (frozen lockfile in CI)
RUN pnpm install --frozen-lockfile --filter @house-by-us/server...


# ── Stage 2: Build TypeScript ─────────────────────────────────────────────────
FROM deps AS builder

COPY backend/ ./backend/

WORKDIR /app/backend/server
RUN pnpm build


# ── Stage 3: Production image ─────────────────────────────────────────────────
FROM node:20-alpine AS runner

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Only copy production artifacts
COPY --from=builder /app/backend/server/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/backend/server/node_modules ./backend/server/node_modules
COPY --from=builder /app/backend/drizzle ./backend/drizzle

ENV NODE_ENV=production
ENV PORT=4000

EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:4000/health || exit 1

CMD ["node", "dist/server/src/index.js"]
