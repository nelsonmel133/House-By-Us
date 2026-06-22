/**
 * App Router
 *
 * Merges all sub-routers into the single root router exposed via the
 * Express tRPC adapter. The exported `AppRouter` type is what the client
 * package imports for full end-to-end type safety.
 */

import { router } from "../middleware/trpc";
import { authRouter } from "./auth.router";
import { landlordRouter } from "./landlord.router";
import { listingRouter } from "./listing.router";
import { adminRouter } from "./admin.router";

export const appRouter = router({
  auth: authRouter,
  landlord: landlordRouter,
  listing: listingRouter,
  admin: adminRouter,
});

/**
 * Export only the TYPE, never the router instance itself, to the client.
 * This is what enables tRPC's end-to-end type inference without leaking
 * server implementation details.
 */
export type AppRouter = typeof appRouter;
