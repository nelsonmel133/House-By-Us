/**
 * Admin Router
 *
 * Procedures:
 *   - `getReviewQueue`      — paginated queue of pending listings awaiting review
 *   - `reviewListing`       — approve/reject a listing, log to `approvals`, notify landlord
 *   - `getLandlordQueue`    — paginated queue of pending landlord verifications
 *   - `reviewLandlord`      — approve/reject a landlord application
 *   - `getPlatformAnalytics`— global aggregates (revenue, signups, geo distribution)
 *   - `setFeaturedListing`  — manually toggle featured placement (monetization override)
 */

import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { eq, sql, count, gte } from "drizzle-orm";
import {
  listings,
  landlords,
  users,
  approvals,
} from "@house-by-us/drizzle";
import { router, adminProcedure } from "../middleware/trpc";
import { dispatchNotification } from "../lib/notifications";
import { PLATFORM_FEES_USD } from "@house-by-us/shared";

// ── Zod schemas ───────────────────────────────────────────────────────────────

const paginationSchema = z.object({
  limit: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).default(0),
});

const reviewListingSchema = z.object({
  listingId: z.string().uuid(),
  status: z.enum(["approved", "rejected"]),
  reason: z.string().max(1024).optional(),
});

const reviewLandlordSchema = z.object({
  landlordId: z.string().uuid(),
  status: z.enum(["approved", "rejected"]),
  notes: z.string().max(1024).optional(),
});

// ── Router ────────────────────────────────────────────────────────────────────

export const adminRouter = router({
  /**
   * getReviewQueue
   * --------------
   * Paginated list of listings with status='pending', oldest first
   * (FIFO review order — fairer to landlords who submitted earliest).
   */
  getReviewQueue: adminProcedure
    .input(paginationSchema)
    .query(async ({ ctx, input }) => {
      const rows = await ctx.db.query.listings.findMany({
        where: eq(listings.status, "pending"),
        with: {
          media: { orderBy: (m, { asc }) => [asc(m.order)], limit: 3 },
          landlord: {
            columns: {
              id: true,
              businessName: true,
              phoneNumber: true,
              verificationStatus: true,
            },
          },
        },
        orderBy: (l, { asc }) => [asc(l.createdAt)],
        limit: input.limit,
        offset: input.offset,
      });

      const [{ value: totalPending }] = await ctx.db
        .select({ value: count() })
        .from(listings)
        .where(eq(listings.status, "pending"));

      return {
        items: rows,
        total: totalPending,
        hasMore: input.offset + input.limit < totalPending,
      };
    }),

  /**
   * reviewListing
   * -------------
   * Approves or rejects a pending listing.
   *
   * Side effects:
   *   1. Updates `listings.status`
   *   2. Inserts an audit row into `approvals`
   *   3. Dispatches a notification to the landlord
   *
   * Rejections require a `reason` so the landlord understands what to fix.
   */
  reviewListing: adminProcedure
    .input(reviewListingSchema)
    .mutation(async ({ ctx, input }) => {
      if (input.status === "rejected" && !input.reason) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "A reason is required when rejecting a listing.",
        });
      }

      const listing = await ctx.db.query.listings.findFirst({
        where: eq(listings.id, input.listingId),
        with: {
          landlord: { columns: { userId: true } },
        },
      });

      if (!listing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Listing not found." });
      }

      if (listing.status !== "pending") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Listing has already been reviewed (current status: ${listing.status}).`,
        });
      }

      await ctx.db.transaction(async (tx) => {
        await tx
          .update(listings)
          .set({ status: input.status })
          .where(eq(listings.id, input.listingId));

        await tx.insert(approvals).values({
          listingId: input.listingId,
          adminId: ctx.user.id,
          status: input.status,
          reason: input.reason ?? null,
        });
      });

      // Notify the landlord of the outcome
      await dispatchNotification({
        userId: listing.landlord.userId,
        type: input.status === "approved" ? "listing_approved" : "listing_rejected",
        message:
          input.status === "approved"
            ? `Your listing "${listing.title}" has been approved and is now live.`
            : `Your listing "${listing.title}" was not approved. Reason: ${input.reason}`,
        actionUrl: `/dashboard/listings/${listing.id}`,
      });

      return { success: true };
    }),

  /**
   * getLandlordQueue
   * ----------------
   * Paginated queue of landlords awaiting verification approval.
   */
  getLandlordQueue: adminProcedure
    .input(paginationSchema)
    .query(async ({ ctx, input }) => {
      const rows = await ctx.db.query.landlords.findMany({
        where: eq(landlords.verificationStatus, "pending"),
        with: {
          user: {
            columns: { id: true, email: true, displayName: true, createdAt: true },
          },
        },
        orderBy: (l, { asc }) => [asc(l.createdAt)],
        limit: input.limit,
        offset: input.offset,
      });

      const [{ value: totalPending }] = await ctx.db
        .select({ value: count() })
        .from(landlords)
        .where(eq(landlords.verificationStatus, "pending"));

      // Strip encrypted bank details from the response — admins verify identity
      // documents separately; bank details are not needed for this review step.
      const sanitised = rows.map(({ bankDetailsEncrypted, ...rest }) => rest);

      return {
        items: sanitised,
        total: totalPending,
        hasMore: input.offset + input.limit < totalPending,
      };
    }),

  /**
   * reviewLandlord
   * --------------
   * Approves or rejects a landlord's verification application.
   */
  reviewLandlord: adminProcedure
    .input(reviewLandlordSchema)
    .mutation(async ({ ctx, input }) => {
      const landlord = await ctx.db.query.landlords.findFirst({
        where: eq(landlords.id, input.landlordId),
      });

      if (!landlord) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Landlord not found." });
      }

      if (landlord.verificationStatus !== "pending") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Landlord has already been reviewed (current status: ${landlord.verificationStatus}).`,
        });
      }

      await ctx.db
        .update(landlords)
        .set({
          verificationStatus: input.status,
          verificationNotes: input.notes ?? null,
        })
        .where(eq(landlords.id, input.landlordId));

      await dispatchNotification({
        userId: landlord.userId,
        type: "verification_update",
        message:
          input.status === "approved"
            ? "Congratulations! Your landlord account has been verified. You can now publish listings."
            : `Your landlord application was not approved. ${input.notes ?? ""}`.trim(),
        actionUrl: "/dashboard",
      });

      return { success: true };
    }),

  /**
   * getPlatformAnalytics
   * --------------------
   * Global platform-wide aggregates for the admin analytics dashboard.
   *
   * Returns:
   *   - totalUsers, totalLandlords, totalStudentsActive (role='user')
   *   - totalListings broken down by status
   *   - estimatedPlatformRevenue — MONETIZATION placeholder based on
   *     subscription tier pricing * active subscriber counts
   *   - geoDistribution — listing density by rounded lat/lng grid cell,
   *     useful for a heatmap visualisation of housing supply across Harare
   *   - newLandlordSignups — last 30 days, for growth tracking
   */
  getPlatformAnalytics: adminProcedure.query(async ({ ctx }) => {
    // ── User counts by role ──────────────────────────────────────────────────
    const userCounts = await ctx.db
      .select({ role: users.role, value: count() })
      .from(users)
      .groupBy(users.role);

    const usersByRole = userCounts.reduce(
      (acc, row) => ({ ...acc, [row.role]: row.value }),
      {} as Record<string, number>
    );

    // ── Listing counts by status ─────────────────────────────────────────────
    const listingCounts = await ctx.db
      .select({ status: listings.status, value: count() })
      .from(listings)
      .groupBy(listings.status);

    const listingsByStatus = listingCounts.reduce(
      (acc, row) => ({ ...acc, [row.status]: row.value }),
      {} as Record<string, number>
    );

    // ── Subscription tier distribution (for revenue estimate) ──────────────
    const tierCounts = await ctx.db
      .select({ tier: landlords.subscriptionTier, value: count() })
      .from(landlords)
      .where(eq(landlords.verificationStatus, "approved"))
      .groupBy(landlords.subscriptionTier);

    const tierDistribution = tierCounts.reduce(
      (acc, row) => ({ ...acc, [row.tier]: row.value }),
      {} as Record<string, number>
    );

    /**
     * MONETIZATION: Estimated Monthly Recurring Revenue (MRR).
     * Calculated from subscription tier pricing × active subscriber counts.
     * This is a model estimate, not a ledger of actual payments — wire up
     * a `payments` / `subscriptions` table with a payment gateway (e.g.
     * Paynow, EcoCash API, or Stripe) for accurate financial reporting.
     */
    const estimatedMRR =
      (tierDistribution.basic ?? 0) * PLATFORM_FEES_USD.subscriptions.basic +
      (tierDistribution.premium ?? 0) * PLATFORM_FEES_USD.subscriptions.premium;

    // ── New landlord signups in last 30 days ─────────────────────────────────
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const [{ value: newLandlordSignups }] = await ctx.db
      .select({ value: count() })
      .from(landlords)
      .where(gte(landlords.createdAt, thirtyDaysAgo));

    // ── Geo distribution: bucket listings into ~1km grid cells for a heatmap ──
    // Rounding lat/lng to 2 decimal places ≈ 1.1km grid resolution at Harare's latitude.
    const geoRows = await ctx.db
      .select({
        latBucket: sql<number>`ROUND(${listings.latitude}, 2)`,
        lngBucket: sql<number>`ROUND(${listings.longitude}, 2)`,
        value: count(),
      })
      .from(listings)
      .where(eq(listings.status, "approved"))
      .groupBy(
        sql`ROUND(${listings.latitude}, 2)`,
        sql`ROUND(${listings.longitude}, 2)`
      );

    return {
      users: {
        total:
          (usersByRole.user ?? 0) +
          (usersByRole.landlord ?? 0) +
          (usersByRole.admin ?? 0),
        students: usersByRole.user ?? 0,
        landlords: usersByRole.landlord ?? 0,
        admins: usersByRole.admin ?? 0,
        newLandlordSignups30d: newLandlordSignups,
      },
      listings: {
        total:
          (listingsByStatus.pending ?? 0) +
          (listingsByStatus.approved ?? 0) +
          (listingsByStatus.rejected ?? 0),
        pending: listingsByStatus.pending ?? 0,
        approved: listingsByStatus.approved ?? 0,
        rejected: listingsByStatus.rejected ?? 0,
      },
      monetization: {
        subscriptionTierDistribution: {
          free: tierDistribution.free ?? 0,
          basic: tierDistribution.basic ?? 0,
          premium: tierDistribution.premium ?? 0,
        },
        estimatedMRR_USD: estimatedMRR,
        // PLACEHOLDER: wire to real payment ledger for accurate totals
        estimatedPlatformRevenueNote:
          "Estimate based on subscription tier pricing model, not actual payment records.",
      },
      geoDistribution: geoRows.map((row) => ({
        latitude: row.latBucket,
        longitude: row.lngBucket,
        listingCount: row.value,
      })),
    };
  }),

  /**
   * setFeaturedListing
   * -------------------
   * Admin override to manually toggle a listing's featured placement —
   * useful for manually granting promotional boosts (e.g. partnership deals)
   * outside of the standard self-serve payment flow.
   *
   * MONETIZATION: In the self-serve flow, this would instead be triggered
   * automatically by a payment webhook handler after a landlord purchases
   * a "Boost" add-on (see PLATFORM_FEES_USD.boosts in shared/index.ts).
   */
  setFeaturedListing: adminProcedure
    .input(
      z.object({
        listingId: z.string().uuid(),
        isFeatured: z.boolean(),
        featuredDays: z.number().int().min(1).max(90).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [listing] = await ctx.db
        .select({ id: listings.id })
        .from(listings)
        .where(eq(listings.id, input.listingId))
        .limit(1);

      if (!listing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Listing not found." });
      }

      const featuredUntil = input.isFeatured
        ? new Date(
            Date.now() + (input.featuredDays ?? 30) * 24 * 60 * 60 * 1000
          )
        : null;

      await ctx.db
        .update(listings)
        .set({ isFeatured: input.isFeatured, featuredUntil })
        .where(eq(listings.id, input.listingId));

      return { success: true, featuredUntil };
    }),
});

export type AdminRouter = typeof adminRouter;
