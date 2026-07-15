# House-By-Us — Client

Student boarding-house marketplace for Harare. React (Vite) + TypeScript + Tailwind + shadcn/ui (Radix) + Framer Motion + tRPC + react-hook-form/zod.

## Quick start

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # typecheck + production bundle
```

## Design system

Grounded in Harare's own materials rather than a generic SaaS palette:

| Token | Hex | Use |
|---|---|---|
| `clay-500` | `#C2542D` | Primary actions, price tags — red clay/brick |
| `forest-500` | `#1F3D2B` | Trust signals, verified badges — msasa/jacaranda green |
| `brass-500` | `#D4A24C` | Monetization / premium accents — brass, sun |
| `sand-100` | `#FAF6EE` | App background — warm cream |
| `ink-900` | `#1C1917` | Primary text — charcoal ink |

Type: **Fraunces** (display/headlines), **Inter** (UI/body), **JetBrains Mono** (prices, coordinates, data).

**Signature element**: the custom map pin — a teardrop marker with a roofline glyph cut into it, color-coded by verification status (`forest` = verified, `brass` = pending, `grey` = rejected). It's reused identically across search results, the listing detail map, the landlord's location picker, and the admin coordinates checker, so trust state is legible everywhere a pin appears. See `src/components/map/listing-pin.tsx`.

## Structure

```
src/
  pages/
    search.tsx                 → /search        split map+grid marketplace
    listing-detail.tsx         → /listings/:id   gallery, specs, contact widget
    dashboard-landlord.tsx     → /dashboard/landlord
    dashboard-admin.tsx        → /dashboard/admin
  components/
    map/                       custom pin + react-leaflet wrapper
    search/                    filter bar, listing card
    listing/                   media gallery (lightbox), specs card, contact widget, sign-in modal
    dashboard/landlord/        metrics, leads inbox, monetization panel, listing-form/ (3-step wizard)
    dashboard/admin/           queue list, detail pane, coordinates checker, rejection modal, analytics
    ui/                        shadcn-style primitives (button, card, dialog, select, primitives.tsx)
  lib/
    trpc.ts                    tRPC React client + QueryClient
    trpc-router-types.ts       ⚠️ ambient AppRouter — see below
    mock-data.ts                standalone demo data shaped like real query results
  types/domain.ts               shared domain types (Listing, SearchFilters, etc.)
```

## Wiring to the real backend

This deliverable ships without the `server/` package, so `src/lib/trpc-router-types.ts` builds a structurally-equivalent `AppRouter` with `initTRPC` purely so `createTRPCReact<AppRouter>()` type-checks standalone.

**To connect to the real monorepo backend**, in `src/lib/trpc.ts` change:

```ts
import type { AppRouter } from "./trpc-router-types";
```
to:
```ts
import type { AppRouter } from "@house-by-us/server";
```

Then delete `trpc-router-types.ts`. No other file changes — every page already calls through `trpc.*.useQuery/useMutation`-shaped hooks once you swap `mock-data.ts` reads for the real hooks (each page has a `// In production: trpc.x.y.useQuery(...)` comment marking exactly where).

## Notable interaction details

- **Search**: hovering a listing card flies the map to that pin; hovering a pin highlights the matching card. Mobile collapses to a List/Map toggle.
- **Listing detail**: contact form gates on auth — unauthenticated submissions open the OAuth modal, then auto-resubmits intent context (message vs. callback) once "signed in."
- **Landlord wizard**: step validation runs against the matching zod sub-schema before advancing; media upload simulates the real presigned-S3 flow (request URL → PUT with progress → mark done), including a randomized failure path with a retry button.
- **Admin panel**: rejecting requires a non-trivial reason (≥12 chars) before the action is enabled; approve/reject is irreversible per session and replaced with a status banner.
