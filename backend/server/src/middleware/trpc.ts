/**
 * tRPC v11 initialisation.
 *
 * Exports:
 *   - `createContext`       — request context factory (used in Express adapter)
 *   - `router`              — creates sub-routers
 *   - `publicProcedure`     — no auth required
 *   - `protectedProcedure`  — any authenticated user
 *   - `landlordProcedure`   — authenticated + role=landlord + verified
 *   - `adminProcedure`      — authenticated + role=admin
 */

import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { db, users, landlords } from "@house-by-us/drizzle";
import { eq } from "drizzle-orm";
import type { Request, Response } from "express";
import type { Context } from "../types/context";

// ── Context factory ───────────────────────────────────────────────────────────

/**
 * Called for every incoming request. Resolves the session user and (if
 * applicable) their landlord profile from the database.
 *
 * Session is managed by express-session with HTTP-only, Secure, SameSite=Lax
 * cookies. The session stores `{ userId: string }` after OAuth completion.
 */
export async function createContext({
  req,
  res,
}: {
  req: Request;
  res: Response;
}): Promise<Context> {
  let user = null;
  let landlord = null;

  const sessionUserId = (req.session as any)?.userId as string | undefined;

  if (sessionUserId) {
    // Single query with left-join to fetch user + landlord profile in one round-trip
    const result = await db
      .select()
      .from(users)
      .leftJoin(landlords, eq(landlords.userId, users.id))
      .where(eq(users.id, sessionUserId))
      .limit(1);

    if (result[0]) {
      user = result[0].users;
      landlord = result[0].landlords ?? null;
    } else {
      // Session references a deleted user — invalidate
      req.session.destroy(() => {});
    }
  }

  return { req, res, db, user, landlord };
}

// ── tRPC init ─────────────────────────────────────────────────────────────────

const t = initTRPC.context<Context>().create({
  /**
   * SuperJSON transformer handles Date, Map, Set, BigInt serialisation
   * transparently between server and client.
   */
  transformer: superjson,

  /**
   * Custom error formatter — strips internal server details in production
   * but preserves them in development for easier debugging.
   */
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        // Only expose stack traces in development
        stack:
          process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
    };
  },
});

export const router = t.router;
export const middleware = t.middleware;

// ── Logging middleware ────────────────────────────────────────────────────────

const loggerMiddleware = middleware(async ({ path, type, next }) => {
  const start = Date.now();
  const result = await next();
  const durationMs = Date.now() - start;

  const status = result.ok ? "OK" : "ERR";
  console.log(`[tRPC] ${type.toUpperCase()} ${path} — ${status} (${durationMs}ms)`);

  return result;
});

// ── Base procedures ───────────────────────────────────────────────────────────

/** No authentication required. Available to all visitors. */
export const publicProcedure = t.procedure.use(loggerMiddleware);

// ── Auth middleware ───────────────────────────────────────────────────────────

const enforceAuthenticated = middleware(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "You must be signed in to perform this action.",
    });
  }
  return next({ ctx: { ...ctx, user: ctx.user } });
});

/** Requires an authenticated session. Any role allowed. */
export const protectedProcedure = t.procedure
  .use(loggerMiddleware)
  .use(enforceAuthenticated);

// ── Landlord middleware ───────────────────────────────────────────────────────

const enforceLandlord = middleware(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Not authenticated." });
  }

  if (ctx.user.role !== "landlord") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Only landlords can access this resource.",
    });
  }

  if (!ctx.landlord) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Landlord profile not found. Please complete onboarding.",
    });
  }

  if (ctx.landlord.verificationStatus === "pending") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message:
        "Your landlord account is pending verification. You will be notified once approved.",
    });
  }

  if (ctx.landlord.verificationStatus === "rejected") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message:
        "Your landlord application has been rejected. Please contact support.",
    });
  }

  return next({ ctx: { ...ctx, user: ctx.user, landlord: ctx.landlord } });
});

/**
 * Requires authenticated user with role='landlord' AND verificationStatus='approved'.
 *
 * MONETIZATION NOTE: Add subscription check here to gate premium features:
 *   if (ctx.landlord.subscriptionTier === 'free' && isPremiumFeature) throw FORBIDDEN
 */
export const landlordProcedure = t.procedure
  .use(loggerMiddleware)
  .use(enforceAuthenticated)
  .use(enforceLandlord);

// ── Admin middleware ──────────────────────────────────────────────────────────

const enforceAdmin = middleware(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Not authenticated." });
  }

  if (ctx.user.role !== "admin") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Administrator access required.",
    });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user as typeof ctx.user & { role: "admin" },
    },
  });
});

/** Requires authenticated user with role='admin'. */
export const adminProcedure = t.procedure
  .use(loggerMiddleware)
  .use(enforceAuthenticated)
  .use(enforceAdmin);
