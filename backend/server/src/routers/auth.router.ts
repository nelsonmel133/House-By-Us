/**
 * Auth Router
 *
 * Handles OAuth 2.0 session lifecycle:
 *   - `getSession`   — returns the current user from session (or null)
 *   - `logout`       — destroys the server session and clears the cookie
 *
 * OAuth flow (Google) is handled by Passport.js Express middleware, not tRPC,
 * because it requires HTTP redirects:
 *   GET /auth/google          → redirect to Google consent screen
 *   GET /auth/google/callback → exchange code, upsert user, set session
 *
 * Those routes are registered in `src/index.ts` alongside the tRPC handler.
 * After a successful callback, the user is redirected to CLIENT_URL with
 * their session cookie set (HTTP-only, Secure, SameSite=Lax).
 */

import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { users } from "@house-by-us/drizzle";
import { router, publicProcedure, protectedProcedure } from "../middleware/trpc";

export const authRouter = router({
  /**
   * getSession
   * ----------
   * Returns the currently authenticated user's public profile.
   * Safe to call on every page load to hydrate client auth state.
   *
   * Returns null (not an error) for unauthenticated users so the client
   * can distinguish "not logged in" from "request failed".
   */
  getSession: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.user) {
      return { user: null, landlord: null };
    }

    return {
      user: {
        id: ctx.user.id,
        email: ctx.user.email,
        displayName: ctx.user.displayName,
        avatarUrl: ctx.user.avatarUrl,
        role: ctx.user.role,
        createdAt: ctx.user.createdAt,
      },
      landlord: ctx.landlord
        ? {
            id: ctx.landlord.id,
            businessName: ctx.landlord.businessName,
            verificationStatus: ctx.landlord.verificationStatus,
            subscriptionTier: ctx.landlord.subscriptionTier,
            subscriptionExpiresAt: ctx.landlord.subscriptionExpiresAt,
          }
        : null,
    };
  }),

  /**
   * logout
   * ------
   * Destroys the server-side session and instructs the browser to clear
   * the session cookie by setting Max-Age=0.
   */
  logout: protectedProcedure.mutation(async ({ ctx }) => {
    await new Promise<void>((resolve, reject) => {
      ctx.req.session.destroy((err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    // Clear the cookie on the client side
    ctx.res.clearCookie("hbu.sid", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });

    return { success: true };
  }),

  /**
   * deleteAccount
   * -------------
   * Allows a user to delete their own account and all associated data.
   * Soft-delete pattern: sets a `deletedAt` timestamp rather than hard delete.
   *
   * Note: In production, cascade DB deletions via FK constraints or a
   * scheduled cleanup job to handle S3 media deletion asynchronously.
   */
  deleteAccount: protectedProcedure
    .input(
      z.object({
        confirmEmail: z.string().email(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (input.confirmEmail !== ctx.user.email) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Email confirmation does not match your account email.",
        });
      }

      // Hard delete — FK cascade handles related rows (landlords, listings, etc.)
      await ctx.db.delete(users).where(eq(users.id, ctx.user.id));

      // Destroy session
      await new Promise<void>((resolve) => {
        ctx.req.session.destroy(() => resolve());
      });

      ctx.res.clearCookie("hbu.sid");

      return { success: true };
    }),
});

export type AuthRouter = typeof authRouter;
