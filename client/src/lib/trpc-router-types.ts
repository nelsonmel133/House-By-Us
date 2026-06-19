/**
 * Ambient mirror of the backend's `AppRouter`.
 *
 * This file exists ONLY because the real `server/` package isn't part of
 * this deliverable. In the monorepo, DELETE this file and change the single
 * import in `lib/trpc.ts` to:
 *
 *   import type { AppRouter } from "@house-by-us/server";
 *
 * Every hook in this app (`trpc.listings.search.useQuery`, etc.) is typed
 * against this shape, so the swap is a one-line, zero-runtime-risk change —
 * input/output types will be checked against the real router automatically.
 *
 * We build this with `initTRPC` (rather than a hand-rolled interface) so it
 * structurally satisfies tRPC's `Router` constraint exactly the way the real
 * backend router does — this file is never executed, only its inferred type
 * is consumed by `createTRPCReact<AppRouter>()`.
 */
import { initTRPC } from "@trpc/server";
import type {
  Listing,
  SearchFilters,
  LandlordDashboardMetrics,
  LeadRequest,
  MonetizationBoost,
  AdminQueueItem,
} from "../types/domain";

const t = initTRPC.create();

const listingsRouter = t.router({
  search: t.procedure
    .input((v: unknown) => v as Partial<SearchFilters>)
    .query((): { items: Listing[]; total: number } => ({ items: [], total: 0 })),
  byId: t.procedure
    .input((v: unknown) => v as { id: string })
    .query((): Listing | null => null),
  create: t.procedure
    .input((v: unknown) => v as Partial<Listing>)
    .mutation((): { id: string } => ({ id: "" })),
  requestPresignedUpload: t.procedure
    .input((v: unknown) => v as { fileName: string; contentType: string })
    .mutation((): { uploadUrl: string; fileKey: string } => ({ uploadUrl: "", fileKey: "" })),
});

const leadsRouter = t.router({
  create: t.procedure
    .input((v: unknown) => v as { listingId: string; message: string; channel: "callback" | "message" })
    .mutation((): { id: string } => ({ id: "" })),
  listForLandlord: t.procedure
    .input((v: unknown) => v as { landlordId: string })
    .query((): LeadRequest[] => []),
});

const landlordDashboardRouter = t.router({
  metrics: t.procedure
    .input((v: unknown) => v as { landlordId: string })
    .query((): LandlordDashboardMetrics => ({
      totalViews: 0,
      viewsDeltaPct: 0,
      totalLeads: 0,
      leadsDeltaPct: 0,
      earningsUsd: 0,
      earningsDeltaPct: 0,
      activeListings: 0,
    })),
  boosts: t.procedure.query((): MonetizationBoost[] => []),
  purchaseBoost: t.procedure
    .input((v: unknown) => v as { boostId: string; listingId: string })
    .mutation((): { checkoutUrl: string } => ({ checkoutUrl: "" })),
});

const adminRouter = t.router({
  queue: t.procedure.query((): AdminQueueItem[] => []),
  approve: t.procedure
    .input((v: unknown) => v as { listingId: string })
    .mutation((): { success: true } => ({ success: true })),
  reject: t.procedure
    .input((v: unknown) => v as { listingId: string; reason: string })
    .mutation((): { success: true } => ({ success: true })),
});

const authRouter = t.router({
  session: t.procedure.query(
    (): { userId: string; name: string; role: "student" | "landlord" | "admin" } | null => null
  ),
  oauthSignIn: t.procedure
    .input((v: unknown) => v as { provider: "google" | "facebook" })
    .mutation((): { redirectUrl: string } => ({ redirectUrl: "" })),
});

const appRouter = t.router({
  listings: listingsRouter,
  leads: leadsRouter,
  landlordDashboard: landlordDashboardRouter,
  admin: adminRouter,
  auth: authRouter,
});

export type AppRouter = typeof appRouter;

