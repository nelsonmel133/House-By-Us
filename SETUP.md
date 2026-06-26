# House-By-Us — Local Setup Guide

## Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Node.js | ≥ 20 | https://nodejs.org |
| pnpm | ≥ 9 | `npm i -g pnpm` |
| MySQL | 8.0+ | Docker (see below) or https://dev.mysql.com |
| Docker | any | https://docs.docker.com/get-docker/ (optional) |

---

## 1. Clone & install

```bash
git clone https://github.com/YOUR_ORG/house-by-us.git
cd house-by-us
pnpm install
```

---

## 2. Provision external services

### MySQL
The quickest path is Docker:
```bash
docker compose up db -d
```
This starts MySQL on port `3306` with credentials matching `.env.example`.

### Google OAuth
1. Go to https://console.cloud.google.com/apis/credentials
2. Create an **OAuth 2.0 Client ID** (Web application)
3. Add `http://localhost:4000/auth/google/callback` to Authorised redirect URIs
4. Copy the Client ID and Secret

### AWS S3
1. Create a bucket named `house-by-us-media` in region `af-south-1`
2. Create an IAM user with `s3:PutObject`, `s3:GetObject`, `s3:DeleteObject` on that bucket
3. Generate an Access Key / Secret Key pair

---

## 3. Configure environment

```bash
cp backend/server/.env.example backend/server/.env
```

Edit `backend/server/.env` and fill in every value:

```bash
# Generate session secret:
openssl rand -hex 32

# Generate encryption key (must be exactly 64 hex chars):
openssl rand -hex 32
```

For the client:
```bash
cp client/.env.example client/.env
# VITE_API_URL is http://localhost:4000/trpc by default — no changes needed for local dev
```

---

## 4. Push the database schema

```bash
pnpm db:push
```

This runs `drizzle-kit push` against your MySQL instance and creates all tables.

---

## 5. Start development servers

**Option A — separate terminals (recommended)**
```bash
# Terminal 1 — API server (port 4000)
pnpm dev

# Terminal 2 — React client (port 5173)
pnpm dev:client
```

**Option B — concurrent**
```bash
pnpm dev:all
```

**Option C — Docker Compose (full stack)**
```bash
docker compose up
```

---

## 6. Mobile (Expo)

```bash
cd mobile
pnpm install
cp .env.example .env   # set EXPO_PUBLIC_API_BASE_URL to your LAN IP
pnpm start
```

Scan the QR code with Expo Go on your phone, or press `a`/`i` for emulators.

---

## Deployment quick reference

| Target | Command / Service |
|--------|------------------|
| Backend | Railway → connect repo, set env vars, `railway up` |
| Frontend | Vercel → import repo, root = `.`, output = `client/dist` |
| Mobile | `cd mobile && eas build --platform all --profile production` |
| DB schema | `pnpm db:push` from your CI or a one-off Railway job |
