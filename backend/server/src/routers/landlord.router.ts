/**
 * Landlord Router
 *
 * Procedures:
 *   - `onboard`        — first-time landlord profile creation (bank details, business name)
 *   - `getDashboard`   — aggregated stats for the landlord's own dashboard
 *   - `updateProfile`  — update business name, phone, bank details
 *   - `getNotifications` — paginated notification inbox
 */

import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { eq, and, sql } from "drizzle-orm";
import {
  users,
  landlords,
  listings,
  notifications,
} from "@house-by-us/drizzle";
import {
  router,
  protectedProcedure,
  landlordProcedure,
} from "../middleware/trpc";
import { encrypt, decrypt } from "../lib/crypto";
import { dispatchNotification } from "../lib/notification";
import { SUBSCRIPTION_LIMITS } from "@house-by-us/shared";

// ── Zod schemas ───────────────────────────────────────────────────────────────

const bankDetailsSchema = z.object({
  provider: z.string().min(1, "Bank/mobile money provider is required"),
  accountName: z.string().min(2),
  accountNumber: z.string().min(5, "Invalid account number"),
  branchCode: z.string().optional(),
  swiftCode: z.string().optional(),
});

// ── Router ────────────────────────────────────────────────────────────────────

export const landlordRouter = router({
  /**
   * onboard
   * -------
   * Converts a regular `user` into a `landlord` by:
   *   1. Creating a `landlords` profile row linked to the user
   *   2. Updating `users.role` to 'landlord'
   *   3. Encrypting bank details before storage
   *
   * After creation, verificationStatus is 'pending' until an admin approves.
   * The user role is updated optimistically so they can access the dashboard,
   * but landlordProcedures will block them until status = 'approved'.
   */
  onboard: protectedProcedure
    .input(
      z.object({
        businessName: z.string().min(2).max(255),
        phoneNumber: z
          .string()
          .regex(
            /^\+263[0-9]{9}$/,
            "Must be a valid Zimbabwean phone number e.g. +263771234567"
          ),
        bankDetails: bankDetailsSchema,
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Prevent double-onboarding
      if (ctx.user.role === "landlord") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You already have a landlord profile.",
        });
      }

      // Encrypt sensitive bank details before storage
      const bankDetailsEncrypted = encrypt(
        JSON.stringify(input.bankDetails)
      );

      // Run both inserts in a logical sequence
      // (MySQL doesn't support DDL in transactions easily with drizzle, use explicit tx)
      await ctx.db.transaction(async (tx) => {
        await tx.insert(landlords).values({
          userId: ctx.user.id,
          businessName: input.businessName,
          phoneNumber: input.phoneNumber,
          bankDetailsEncrypted,
          verificationStatus: "pending",
          subscriptionTier: "free",
        });

        await tx
          .update(users)
          .set({ role: "landlord" })
          .where(eq(users.id, ctx.user.id));
      });

      // Notify admins (in production, query all admin users and notify each)
      // Here we dispatch a system notification to the landlord themselves
      await dispatchNotification({
        userId: ctx.user.id,
        type: "verification_update",
        message:
          "Your landlord application has been received and is under review. " +
          "We aim to respond within 1–2 business days.",
      });

      return { success: true };
    }),

  /**
   * getDashboard
   * ------------
   * Returns aggregated stats for the authenticated landlord's dashboard.
   *
   * Stats returned:
   *   - totalListings       — all listings (any status)
   *   - activeListings      — approved and visible
   *   - pendingListings     — awaiting admin review
   *   - rejectedListings    — rejected by admin
   *   - totalEnquiries      — sum of enquiry_count across all listings
   *   - totalImpressions    — sum of impression_count across all listings
   *   - estimatedMonthlyRevenue — pricePerMonth * (approved listings) [placeholder]
   *
   * MONETIZATION: `estimatedMonthlyRevenue` is a placeholder. In production,
   * replace with actual payment records from a `payments` table once a
   * rent collection or subscription billing feature is implemented.
   */
  getDashboard: landlordProcedure.query(async ({ ctx }) => {
    const landlordId = ctx.landlord.id;

    const allListings = await ctx.db
      .select({
        status: listings.status,
        pricePerMonth: listings.pricePerMonth,
        enquiryCount: listings.enquiryCount,
        impressionCount: listings.impressionCount,
        isFeatured: listings.isFeatured,
      })
      .from(listings)
      .where(eq(listings.landlordId, landlordId));

    const stats = allListings.reduce(
      (acc, l) => {
        acc.totalListings++;
        acc.totalEnquiries += l.enquiryCount;
        acc.totalImpressions += l.impressionCount;

        if (l.status === "approved") {
          acc.activeListings++;
          acc.estimatedMonthlyRevenue += parseFloat(l.pricePerMonth);
        } else if (l.status === "pending") {
          acc.pendingListings++;
        } else if (l.status === "rejected") {
          acc.rejectedListings++;
        }

        if (l.isFeatured) acc.featuredListings++;

        return acc;
      },
      {
        totalListings: 0,
        activeListings: 0,
        pendingListings: 0,
        rejectedListings: 0,
        featuredListings: 0,
        totalEnquiries: 0,
        totalImpressions: 0,
        estimatedMonthlyRevenue: 0,
      }
    );

    // ── Subscription limits ────────────────────────────────────────────────
    const tier = ctx.landlord.subscriptionTier;
    const limits = SUBSCRIPTION_LIMITS[tier];

    return {
      ...stats,
      estimatedMonthlyRevenue: parseFloat(
        stats.estimatedMonthlyRevenue.toFixed(2)
      ),
      subscription: {
        tier,
        expiresAt: ctx.landlord.subscriptionExpiresAt,
        limits: {
          maxListings: limits.maxListings === Infinity ? null : limits.maxListings,
          featuredListings:
            limits.featuredListings === Infinity ? null : limits.featuredListings,
        },
        // MONETIZATION: Flag when landlord is near their listing limit
        nearListingLimit:
          limits.maxListings !== Infinity &&
          stats.activeListings >= limits.maxListings * 0.8,
      },
    };
  }),

  /**
   * updateProfile
   * -------------
   * Allows an approved landlord to update their business profile.
   * Bank details are re-encrypted on each update.
   */
  updateProfile: landlordProcedure
    .input(
      z.object({
        businessName: z.string().min(2).max(255).optional(),
        phoneNumber: z
          .string()
          .regex(/^\+263[0-9]{9}$/)
          .optional(),
        bankDetails: bankDetailsSchema.optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const updates: Partial<typeof landlords.$inferInsert> = {};

      if (input.businessName) updates.businessName = input.businessName;
      if (input.phoneNumber) updates.phoneNumber = input.phoneNumber;
      if (input.bankDetails) {
        updates.bankDetailsEncrypted = encrypt(
          JSON.stringify(input.bankDetails)
        );
      }

      if (Object.keys(updates).length === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No fields provided to update.",
        });
      }

      await ctx.db
        .update(landlords)
        .set(updates)
        .where(eq(landlords.id, ctx.landlord.id));

      return { success: true };
    }),

  /**
   * getBankDetails
   * --------------
   * Returns decrypted bank details for the authenticated landlord.
   * Never logged, never cached, never exposed to other roles.
   */
  getBankDetails: landlordProcedure.query(async ({ ctx }) => {
    if (!ctx.landlord.bankDetailsEncrypted) {
      return { bankDetails: null };
    }

    const raw = decrypt(ctx.landlord.bankDetailsEncrypted);
    const bankDetails = JSON.parse(raw);

    return { bankDetails };
  }),

  /**
   * getNotifications
   * ----------------
   * Paginated notification inbox for the current user.
   */
  getNotifications: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).default(20),
        cursor: z.string().optional(), // notification ID for cursor-based pagination
      })
    )
    .query(async ({ ctx, input }) => {
      const { limit, cursor } = input;

      // Cursor pagination: fetch the cursor row's createdAt, then page strictly
      // before it. This avoids skipping/duplicating rows when new notifications
      // arrive between page fetches (unlike offset-based pagination).
      let cursorCreatedAt: Date | undefined;
      if (cursor) {
        const [cursorRow] = await ctx.db
          .select({ createdAt: notifications.createdAt })
          .from(notifications)
          .where(
            and(eq(notifications.id, cursor), eq(notifications.userId, ctx.user.id))
          )
          .limit(1);
        cursorCreatedAt = cursorRow?.createdAt;
      }

      const rows = await ctx.db
        .select()
        .from(notifications)
        .where(
          and(
            eq(notifications.userId, ctx.user.id),
            cursorCreatedAt
              ? sql`${notifications.createdAt} < ${cursorCreatedAt}`
              : undefined
          )
        )
        .orderBy(sql`${notifications.createdAt} DESC`)
        .limit(limit + 1); // fetch one extra to determine if there's a next page

      let nextCursor: string | undefined;
      if (rows.length > limit) {
        const next = rows.pop()!;
        nextCursor = next.id;
      }

      return { items: rows, nextCursor };
    }),

  /**
   * markNotificationsRead
   * ---------------------
   * Mark all unread notifications as read for the current user.
   */
  markNotificationsRead: protectedProcedure.mutation(async ({ ctx }) => {
    await ctx.db
      .update(notifications)
      .set({ readStatus: true })
      .where(
        and(
          eq(notifications.userId, ctx.user.id),
          eq(notifications.readStatus, false)
        )
      );

    return { success: true };
  }),
});

export type LandlordRouter = typeof landlordRouter;
