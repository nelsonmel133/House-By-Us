# House-By-Us — Backend

Backend for a platform helping tertiary students in Harare, Zimbabwe find boarding
houses near their universities. Built with **tRPC v11**, **Drizzle ORM** (MySQL),
**Express**, and **Passport.js Google OAuth**.

This has been verified end-to-end: `npm install` → `tsc --noEmit` passes with
zero errors across the whole workspace.

## Monorepo layout

```
house-by-us/
├── drizzle/            # @house-by-us/drizzle — schema + DB connection
│   ├── schema/
│   │   ├── users.ts
│   │   ├── landlords.ts
│   │   ├── listings.ts
│   │   ├── media.ts
│   │   ├── approvals.ts
│   │   └── notifications.ts
│   ├── index.ts        # exports `db` + all tables/relations
│   └── drizzle.config.ts
├── shared/             # @house-by-us/shared — types/constants shared cross-package
│   └── index.ts         # university coords, subscription tiers, fee constants
└── server/             # @house-by-us/server — Express + tRPC API
    └── src/
        ├── index.ts             # Express entrypoint, OAuth routes, tRPC mount
        ├── middleware/trpc.ts   # tRPC init, context factory, RBAC procedures
        ├── routers/
        │   ├── _app.router.ts   # merges all sub-routers
        │   ├── auth.router.ts
        │   ├── landlord.router.ts
        │   ├── listing.router.ts
        │   └── admin.router.ts
        ├── lib/
        │   ├── env.ts           # Zod-validated environment variables
        │   ├── crypto.ts        # AES-256-GCM for encrypting bank details
        │   ├── s3.ts            # presigned upload URL generation
        │   ├── geo.ts           # Haversine distance + bounding box search
        │   ├── passport.ts      # Google OAuth strategy
        │   └── notifications.ts # notification dispatch helper
        └── types/
            ├── context.ts       # tRPC Context/AuthenticatedContext/etc. types
            └── session.d.ts     # express-session module augmentation
```

## Setup

```bash
npm install                       # installs all 3 workspaces
cp server/.env.example server/.env
# fill in DB credentials, Google OAuth keys, AWS creds, encryption key
npm run db:push                   # push schema to MySQL via drizzle-kit
npm run dev                       # starts the Express+tRPC server on :4000
```

Generate the two secrets required in `.env`:
```bash
openssl rand -hex 32   # → SESSION_SECRET
openssl rand -hex 32   # → ENCRYPTION_KEY (exactly 32 bytes / 64 hex chars)
```

## Auth flow

OAuth requires HTTP redirects, which tRPC procedures can't perform — so the
handshake itself lives in plain Express routes, while session *reads* happen
through tRPC's `createContext`:

1. `GET /auth/google` → Passport redirects to Google's consent screen
2. `GET /auth/google/callback` → Passport verifies the code, upserts the
   `users` row, regenerates the session (fixation defence), stores `userId`
3. Every subsequent tRPC request reads `req.session.userId` in `createContext`
   and hydrates `ctx.user` / `ctx.landlord` with a single left-joined query
4. `auth.logout` (a tRPC mutation) destroys the session and clears the cookie

Cookies are `httpOnly`, `sameSite: 'lax'`, and `secure` in production.

## RBAC procedure tiers

Defined once in `middleware/trpc.ts`, reused everywhere:

| Procedure | Requirement |
|---|---|
| `publicProcedure` | none |
| `protectedProcedure` | any logged-in user |
| `landlordProcedure` | `role='landlord'` **and** `verificationStatus='approved'` |
| `adminProcedure` | `role='admin'` |

`landlordProcedure` throws a precise `FORBIDDEN` message depending on whether
the landlord profile is missing, pending, or rejected — so the frontend can
show the right state without guessing.

## Notable implementation decisions

- **UUIDs generated client-side** (`crypto.randomUUID()` via Drizzle's
  `$defaultFn`), not DB `AUTO_INCREMENT`. The installed `drizzle-orm@0.30.10`
  doesn't support MySQL `$returningId()`, so `createListing` generates the ID
  before insert and returns it directly — verified against the installed
  package's actual `.d.ts`, not assumed from memory.
- **Geospatial search** uses a bounding-box pre-filter (cheap, indexable SQL
  `BETWEEN`) followed by exact Haversine distance calculation + an optional
  in-memory sort. This avoids requiring MySQL spatial extensions, which aren't
  uniformly available across budget hosting tiers.
- **Bank details are encrypted at the application layer** (AES-256-GCM, random
  IV per write) before they ever reach the `landlords.bankDetailsEncrypted`
  column — never logged, never returned except via the explicit
  `getBankDetails` query gated behind `landlordProcedure`.
- **Cursor-based pagination** for notifications resolves the cursor row's
  `createdAt` and pages strictly before it, rather than naive offset
  pagination — so results stay stable even as new notifications arrive
  between page fetches.
- **Editing a listing resets it to `pending`.** This stops a landlord from
  getting a listing approved and then swapping in different content —
  admins always re-review substantive edits.

## Monetization hooks (clearly marked in code with `MONETIZATION:` comments)

- `landlords.subscriptionTier` (`free` / `basic` / `premium`) gates the number
  of active listings a landlord may have (`shared/index.ts → SUBSCRIPTION_LIMITS`)
- `listings.isFeatured` + `featuredUntil` bumps a listing to the top of every
  search result — `admin.setFeaturedListing` is the manual override; in
  production this would instead be flipped by a payment webhook after a
  landlord buys a "Boost" (`PLATFORM_FEES_USD.boosts`)
- `admin.getPlatformAnalytics` returns an estimated MRR computed from
  subscription tier pricing × active subscriber counts — explicitly labelled
  as a model estimate, not a real payment ledger, until a `payments` table and
  gateway (Paynow / EcoCash / Stripe) are wired in

## Known production TODOs (intentionally out of scope here)

- Swap the default in-memory `express-session` store for `connect-redis` —
  called out in a comment in `index.ts`. Required before running >1 instance.
- Wire a real payment gateway and `payments` table to replace the MRR estimate
  with actual transaction records.
- Add a scheduled job to flip `isFeatured` back to `false` once `featuredUntil`
  passes.
# House-By-Us — Backend

Backend for a platform helping tertiary students in Harare, Zimbabwe find boarding
houses near their universities. Built with **tRPC v11**, **Drizzle ORM** (MySQL),
**Express**, and **Passport.js Google OAuth**.

This has been verified end-to-end: `npm install` → `tsc --noEmit` passes with
zero errors across the whole workspace.

## Monorepo layout

```
house-by-us/
├── drizzle/            # @house-by-us/drizzle — schema + DB connection
│   ├── schema/
│   │   ├── users.ts
│   │   ├── landlords.ts
│   │   ├── listings.ts
│   │   ├── media.ts
│   │   ├── approvals.ts
│   │   └── notifications.ts
│   ├── index.ts        # exports `db` + all tables/relations
│   └── drizzle.config.ts
├── shared/             # @house-by-us/shared — types/constants shared cross-package
│   └── index.ts         # university coords, subscription tiers, fee constants
└── server/             # @house-by-us/server — Express + tRPC API
    └── src/
        ├── index.ts             # Express entrypoint, OAuth routes, tRPC mount
        ├── middleware/trpc.ts   # tRPC init, context factory, RBAC procedures
        ├── routers/
        │   ├── _app.router.ts   # merges all sub-routers
        │   ├── auth.router.ts
        │   ├── landlord.router.ts
        │   ├── listing.router.ts
        │   └── admin.router.ts
        ├── lib/
        │   ├── env.ts           # Zod-validated environment variables
        │   ├── crypto.ts        # AES-256-GCM for encrypting bank details
        │   ├── s3.ts            # presigned upload URL generation
        │   ├── geo.ts           # Haversine distance + bounding box search
        │   ├── passport.ts      # Google OAuth strategy
        │   └── notifications.ts # notification dispatch helper
        └── types/
            ├── context.ts       # tRPC Context/AuthenticatedContext/etc. types
            └── session.d.ts     # express-session module augmentation
```

## Setup

```bash
npm install                       # installs all 3 workspaces
cp server/.env.example server/.env
# fill in DB credentials, Google OAuth keys, AWS creds, encryption key
npm run db:push                   # push schema to MySQL via drizzle-kit
npm run dev                       # starts the Express+tRPC server on :4000
```

Generate the two secrets required in `.env`:
```bash
openssl rand -hex 32   # → SESSION_SECRET
openssl rand -hex 32   # → ENCRYPTION_KEY (exactly 32 bytes / 64 hex chars)
```

## Auth flow

OAuth requires HTTP redirects, which tRPC procedures can't perform — so the
handshake itself lives in plain Express routes, while session *reads* happen
through tRPC's `createContext`:

1. `GET /auth/google` → Passport redirects to Google's consent screen
2. `GET /auth/google/callback` → Passport verifies the code, upserts the
   `users` row, regenerates the session (fixation defence), stores `userId`
3. Every subsequent tRPC request reads `req.session.userId` in `createContext`
   and hydrates `ctx.user` / `ctx.landlord` with a single left-joined query
4. `auth.logout` (a tRPC mutation) destroys the session and clears the cookie

Cookies are `httpOnly`, `sameSite: 'lax'`, and `secure` in production.

## RBAC procedure tiers

Defined once in `middleware/trpc.ts`, reused everywhere:

| Procedure | Requirement |
|---|---|
| `publicProcedure` | none |
| `protectedProcedure` | any logged-in user |
| `landlordProcedure` | `role='landlord'` **and** `verificationStatus='approved'` |
| `adminProcedure` | `role='admin'` |

`landlordProcedure` throws a precise `FORBIDDEN` message depending on whether
the landlord profile is missing, pending, or rejected — so the frontend can
show the right state without guessing.

## Notable implementation decisions

- **UUIDs generated client-side** (`crypto.randomUUID()` via Drizzle's
  `$defaultFn`), not DB `AUTO_INCREMENT`. The installed `drizzle-orm@0.30.10`
  doesn't support MySQL `$returningId()`, so `createListing` generates the ID
  before insert and returns it directly — verified against the installed
  package's actual `.d.ts`, not assumed from memory.
- **Geospatial search** uses a bounding-box pre-filter (cheap, indexable SQL
  `BETWEEN`) followed by exact Haversine distance calculation + an optional
  in-memory sort. This avoids requiring MySQL spatial extensions, which aren't
  uniformly available across budget hosting tiers.
- **Bank details are encrypted at the application layer** (AES-256-GCM, random
  IV per write) before they ever reach the `landlords.bankDetailsEncrypted`
  column — never logged, never returned except via the explicit
  `getBankDetails` query gated behind `landlordProcedure`.
- **Cursor-based pagination** for notifications resolves the cursor row's
  `createdAt` and pages strictly before it, rather than naive offset
  pagination — so results stay stable even as new notifications arrive
  between page fetches.
- **Editing a listing resets it to `pending`.** This stops a landlord from
  getting a listing approved and then swapping in different content —
  admins always re-review substantive edits.

## Monetization hooks (clearly marked in code with `MONETIZATION:` comments)

- `landlords.subscriptionTier` (`free` / `basic` / `premium`) gates the number
  of active listings a landlord may have (`shared/index.ts → SUBSCRIPTION_LIMITS`)
- `listings.isFeatured` + `featuredUntil` bumps a listing to the top of every
  search result — `admin.setFeaturedListing` is the manual override; in
  production this would instead be flipped by a payment webhook after a
  landlord buys a "Boost" (`PLATFORM_FEES_USD.boosts`)
- `admin.getPlatformAnalytics` returns an estimated MRR computed from
  subscription tier pricing × active subscriber counts — explicitly labelled
  as a model estimate, not a real payment ledger, until a `payments` table and
  gateway (Paynow / EcoCash / Stripe) are wired in

## Known production TODOs (intentionally out of scope here)

- Swap the default in-memory `express-session` store for `connect-redis` —
  called out in a comment in `index.ts`. Required before running >1 instance.
- Wire a real payment gateway and `payments` table to replace the MRR estimate
  with actual transaction records.
- Add a scheduled job to flip `isFeatured` back to `false` once `featuredUntil`
  passes.

