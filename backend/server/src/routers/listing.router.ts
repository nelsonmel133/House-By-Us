/**
 * Listing Router
 *
 * Procedures:
 *   - `createListing`        — landlord creates a new listing (status='pending')
 *   - `getUploadUrls`        — generates presigned S3 PUT URLs for listing media
 *   - `confirmMediaUploads`  — persists media rows after successful S3 upload
 *   - `getMyListings`        — landlord's own listings (any status)
 *   - `updateListing`        — landlord edits their own listing (resets to pending)
 *   - `deleteListing`        — landlord deletes their own listing + media cleanup
 *   - `getPublicListings`    — public search with geo radius, price, amenity filters
 *   - `getListingById`       — public single listing detail (increments impressions)
 *   - `recordEnquiry`        — increments enquiry counter when student clicks "Contact"
 */

import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { eq, and, between, gte, lte, sql, desc, asc } from "drizzle-orm";
import {
  listings,
  media,
  type Amenity,
} from "@house-by-us/drizzle";
import {
  router,
  publicProcedure,
  landlordProcedure,
} from "../middleware/trpc";
import { generatePresignedUploadUrl, deleteS3Object } from "../lib/s3";
import { getBoundingBox, haversineDistanceKm } from "../lib/geo";
import { SUBSCRIPTION_LIMITS } from "@house-by-us/shared";

// ── Zod schemas ───────────────────────────────────────────────────────────────

const AMENITY_VALUES = [
  "wifi",
  "solar_power",
  "borehole_water",
  "laundry",
  "security_guard",
  "cctv",
  "parking",
  "kitchen",
  "furnished",
  "air_conditioning",
  "study_room",
  "backup_generator",
] as const;

const amenitySchema = z.enum(AMENITY_VALUES);

const createListingSchema = z.object({
  title: z.string().min(5).max(255),
  description: z.string().min(20).max(5000),
  address: z.string().min(5).max(512),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  pricePerMonth: z.number().positive().max(100_000),
  accommodationType: z.enum(["single", "shared"]),
  maxOccupancy: z.number().int().min(1).max(20),
  services: z.array(amenitySchema).default([]),
  rules: z.array(z.string().max(255)).max(20).default([]),
});

const mediaUploadRequestSchema = z.object({
  listingId: z.string().uuid(),
  files: z
    .array(
      z.object({
        mimeType: z.enum([
          "image/jpeg",
          "image/png",
          "image/webp",
          "video/mp4",
        ]),
        fileSizeBytes: z.number().positive(),
      })
    )
    .min(1)
    .max(10), // max 10 files per request
});

const confirmMediaSchema = z.object({
  listingId: z.string().uuid(),
  media: z
    .array(
      z.object({
        s3Key: z.string().min(1),
        publicUrl: z.string().url(),
        type: z.enum(["image", "video"]),
        order: z.number().int().min(0),
      })
    )
    .min(1),
});

const publicSearchSchema = z.object({
  // Geospatial — search near this point within radiusKm
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  radiusKm: z.number().positive().max(50).default(5),

  // Price filters
  minPrice: z.number().nonnegative().optional(),
  maxPrice: z.number().positive().optional(),

  // Accommodation filters
  accommodationType: z.enum(["single", "shared"]).optional(),
  amenities: z.array(amenitySchema).optional(),

  // Pagination
  limit: z.number().min(1).max(50).default(20),
  offset: z.number().min(0).default(0),

  // Sort
  sortBy: z.enum(["price_asc", "price_desc", "newest", "distance"]).default("newest"),
});

// ── Router ────────────────────────────────────────────────────────────────────

export const listingRouter = router({
  /**
   * createListing
   * -------------
   * Creates a new listing in 'pending' status. Enforces subscription tier
   * listing limits before insert.
   */
  createListing: landlordProcedure
    .input(createListingSchema)
    .mutation(async ({ ctx, input }) => {
      // ── Enforce subscription tier listing limits ──────────────────────────
      const tier = ctx.landlord.subscriptionTier;
      const limits = SUBSCRIPTION_LIMITS[tier];

      if (limits.maxListings !== Infinity) {
        const [{ value: currentCount }] = await ctx.db
          .select({ value: sql<number>`COUNT(*)` })
          .from(listings)
          .where(
            and(
              eq(listings.landlordId, ctx.landlord.id),
              sql`${listings.status} != 'rejected'`
            )
          );

        if (currentCount >= limits.maxListings) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message:
              `Your ${tier} plan allows up to ${limits.maxListings} active listings. ` +
              `Upgrade your subscription to add more.`,
          });
        }
      }

      // ── Sanity check: coordinates roughly within Harare metro area ─────────
      // (Loose bounding box — adjust if expanding to other ZW cities)
      const withinHarareRegion =
        input.latitude >= -18.2 &&
        input.latitude <= -17.5 &&
        input.longitude >= 30.7 &&
        input.longitude <= 31.4;

      if (!withinHarareRegion) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Listing coordinates must be within the Harare metro area.",
        });
      }

      const newListingId = crypto.randomUUID();

      await ctx.db.insert(listings).values({
        id: newListingId,
        landlordId: ctx.landlord.id,
        title: input.title,
        description: input.description,
        address: input.address,
        latitude: input.latitude,
        longitude: input.longitude,
        pricePerMonth: input.pricePerMonth.toFixed(2),
        accommodationType: input.accommodationType,
        maxOccupancy: input.maxOccupancy,
        services: input.services,
        rules: input.rules,
        status: "pending",
      });

      return { listingId: newListingId };
    }),

  /**
   * getUploadUrls
   * -------------
   * Generates presigned S3 PUT URLs for the landlord to upload listing media
   * directly from the browser. Verifies the listing belongs to the caller.
   */
  getUploadUrls: landlordProcedure
    .input(mediaUploadRequestSchema)
    .mutation(async ({ ctx, input }) => {
      const [listing] = await ctx.db
        .select({ id: listings.id, landlordId: listings.landlordId })
        .from(listings)
        .where(eq(listings.id, input.listingId))
        .limit(1);

      if (!listing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Listing not found." });
      }

      if (listing.landlordId !== ctx.landlord.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not own this listing.",
        });
      }

      try {
        const results = await Promise.all(
          input.files.map((file) =>
            generatePresignedUploadUrl({
              listingId: input.listingId,
              mimeType: file.mimeType,
              fileSizeBytes: file.fileSizeBytes,
            })
          )
        );

        return { uploads: results };
      } catch (err) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: err instanceof Error ? err.message : "Failed to generate upload URLs.",
        });
      }
    }),

  /**
   * confirmMediaUploads
   * --------------------
   * Called by the client after successfully PUTting files to S3 using the
   * presigned URLs. Persists `media` rows linking files to the listing.
   */
  confirmMediaUploads: landlordProcedure
    .input(confirmMediaSchema)
    .mutation(async ({ ctx, input }) => {
      const [listing] = await ctx.db
        .select({ id: listings.id, landlordId: listings.landlordId })
        .from(listings)
        .where(eq(listings.id, input.listingId))
        .limit(1);

      if (!listing || listing.landlordId !== ctx.landlord.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not own this listing.",
        });
      }

      await ctx.db.insert(media).values(
        input.media.map((m) => ({
          listingId: input.listingId,
          s3Key: m.s3Key,
          url: m.publicUrl,
          type: m.type,
          order: m.order,
        }))
      );

      return { success: true };
    }),

  /**
   * getMyListings
   * -------------
   * Returns all listings owned by the authenticated landlord, regardless
   * of status, including their media.
   */
  getMyListings: landlordProcedure.query(async ({ ctx }) => {
    const rows = await ctx.db.query.listings.findMany({
      where: eq(listings.landlordId, ctx.landlord.id),
      with: { media: { orderBy: (m, { asc }) => [asc(m.order)] } },
      orderBy: (l, { desc }) => [desc(l.createdAt)],
    });

    return rows;
  }),

  /**
   * updateListing
   * -------------
   * Landlord edits their own listing. Any substantive edit resets status
   * to 'pending' so admins re-review the updated content (prevents bait-
   * and-switch listings after approval).
   */
  updateListing: landlordProcedure
    .input(
      createListingSchema.partial().extend({
        listingId: z.string().uuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { listingId, ...updates } = input;

      const [existing] = await ctx.db
        .select({ landlordId: listings.landlordId })
        .from(listings)
        .where(eq(listings.id, listingId))
        .limit(1);

      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Listing not found." });
      }

      if (existing.landlordId !== ctx.landlord.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not own this listing.",
        });
      }

      if (Object.keys(updates).length === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No fields provided to update.",
        });
      }

      await ctx.db
        .update(listings)
        .set({
          ...updates,
          pricePerMonth: updates.pricePerMonth?.toFixed(2),
          // Force re-review on any edit
          status: "pending",
        } as any)
        .where(eq(listings.id, listingId));

      return { success: true };
    }),

  /**
   * deleteListing
   * -------------
   * Deletes a listing owned by the caller, including its S3 media objects.
   */
  deleteListing: landlordProcedure
    .input(z.object({ listingId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [existing] = await ctx.db
        .select({ landlordId: listings.landlordId })
        .from(listings)
        .where(eq(listings.id, input.listingId))
        .limit(1);

      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Listing not found." });
      }

      if (existing.landlordId !== ctx.landlord.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not own this listing.",
        });
      }

      const mediaRows = await ctx.db
        .select({ s3Key: media.s3Key })
        .from(media)
        .where(eq(media.listingId, input.listingId));

      // Best-effort S3 cleanup — don't block DB deletion if S3 calls fail
      await Promise.allSettled(
        mediaRows.map((m) => deleteS3Object(m.s3Key))
      );

      await ctx.db.delete(listings).where(eq(listings.id, input.listingId));

      return { success: true };
    }),

  /**
   * getPublicListings
   * ------------------
   * Public search endpoint with:
   *   - Radius-based geospatial filtering (bounding box pre-filter + exact
   *     Haversine distance sort)
   *   - Price range filtering
   *   - Accommodation type filtering
   *   - Amenity array filtering (listing must contain ALL requested amenities)
   *   - Pagination
   *
   * Only returns listings with status='approved'.
   *
   * MONETIZATION: Featured listings (isFeatured=true, featuredUntil > now)
   * are boosted to the top of results regardless of sort order, simulating
   * a "sponsored placement" model.
   */
  getPublicListings: publicProcedure
    .input(publicSearchSchema)
    .query(async ({ ctx, input }) => {
      const conditions = [eq(listings.status, "approved")];

      // ── Geospatial bounding box pre-filter ─────────────────────────────────
      let bbox: ReturnType<typeof getBoundingBox> | null = null;
      if (input.latitude !== undefined && input.longitude !== undefined) {
        bbox = getBoundingBox(input.latitude, input.longitude, input.radiusKm);
        conditions.push(
          between(listings.latitude, bbox.minLat, bbox.maxLat),
          between(listings.longitude, bbox.minLng, bbox.maxLng)
        );
      }

      // ── Price filters ───────────────────────────────────────────────────────
      if (input.minPrice !== undefined) {
        conditions.push(gte(listings.pricePerMonth, input.minPrice.toFixed(2)));
      }
      if (input.maxPrice !== undefined) {
        conditions.push(lte(listings.pricePerMonth, input.maxPrice.toFixed(2)));
      }

      // ── Accommodation type ────────────────────────────────────────────────
      if (input.accommodationType) {
        conditions.push(eq(listings.accommodationType, input.accommodationType));
      }

      // ── Fetch candidate rows (over-fetch when geo-filtering to allow exact
      //    distance sort + pagination after Haversine refinement) ───────────
      const fetchLimit = bbox ? input.limit * 3 + input.offset : input.limit;

      let orderByClause;
      switch (input.sortBy) {
        case "price_asc":
          orderByClause = asc(listings.pricePerMonth);
          break;
        case "price_desc":
          orderByClause = desc(listings.pricePerMonth);
          break;
        case "distance":
          // Exact distance sort happens in-memory below; default to newest at DB level
          orderByClause = desc(listings.createdAt);
          break;
        default:
          orderByClause = desc(listings.createdAt);
      }

      const candidates = await ctx.db.query.listings.findMany({
        where: and(...conditions),
        with: {
          media: { orderBy: (m, { asc }) => [asc(m.order)], limit: 5 },
        },
        orderBy: () => [
          // Featured listings always bubble to the top (sponsored placement)
          desc(listings.isFeatured),
          orderByClause,
        ],
        limit: fetchLimit,
      });

      // ── Amenity filtering (JSON array containment, done in-memory since
      //    not all MySQL versions support JSON_CONTAINS efficiently with indexes) ──
      let filtered = candidates;
      if (input.amenities && input.amenities.length > 0) {
        filtered = filtered.filter((listing) =>
          input.amenities!.every((required) =>
            (listing.services as Amenity[]).includes(required)
          )
        );
      }

      // ── Exact distance calculation + optional distance sort ────────────────
      let withDistance = filtered.map((listing) => ({
        ...listing,
        distanceKm:
          input.latitude !== undefined && input.longitude !== undefined
            ? Math.round(
                haversineDistanceKm(
                  input.latitude,
                  input.longitude,
                  listing.latitude,
                  listing.longitude
                ) * 10
              ) / 10
            : null,
      }));

      // Drop anything outside the true radius (bounding box is a superset)
      if (input.latitude !== undefined && input.longitude !== undefined) {
        withDistance = withDistance.filter(
          (l) => l.distanceKm !== null && l.distanceKm <= input.radiusKm
        );
      }

      if (input.sortBy === "distance") {
        withDistance.sort((a, b) => {
          // Featured still bubbles first even in distance sort
          if (a.isFeatured !== b.isFeatured) return a.isFeatured ? -1 : 1;
          return (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity);
        });
      }

      // ── Final pagination slice ─────────────────────────────────────────────
      const page = withDistance.slice(input.offset, input.offset + input.limit);

      return {
        items: page,
        hasMore: withDistance.length > input.offset + input.limit,
        total: withDistance.length,
      };
    }),

  /**
   * getListingById
   * --------------
   * Public single-listing detail view. Increments the impression counter
   * (fire-and-forget) for landlord analytics.
   */
  getListingById: publicProcedure
    .input(z.object({ listingId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const listing = await ctx.db.query.listings.findFirst({
        where: and(
          eq(listings.id, input.listingId),
          eq(listings.status, "approved")
        ),
        with: {
          media: { orderBy: (m, { asc }) => [asc(m.order)] },
          landlord: {
            columns: {
              businessName: true,
              phoneNumber: true,
              verificationStatus: true,
            },
          },
        },
      });

      if (!listing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Listing not found or not yet approved.",
        });
      }

      // Fire-and-forget impression increment — don't block the response
      ctx.db
        .update(listings)
        .set({ impressionCount: sql`${listings.impressionCount} + 1` })
        .where(eq(listings.id, input.listingId))
        .catch((err) => console.error("Failed to increment impression count:", err));

      return listing;
    }),

  /**
   * recordEnquiry
   * -------------
   * Called when a student clicks "Contact Landlord" on a listing.
   * Increments the listing's enquiry counter for landlord analytics.
   */
  recordEnquiry: publicProcedure
    .input(z.object({ listingId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [listing] = await ctx.db
        .select({ id: listings.id })
        .from(listings)
        .where(
          and(eq(listings.id, input.listingId), eq(listings.status, "approved"))
        )
        .limit(1);

      if (!listing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Listing not found." });
      }

      await ctx.db
        .update(listings)
        .set({ enquiryCount: sql`${listings.enquiryCount} + 1` })
        .where(eq(listings.id, input.listingId));

      return { success: true };
    }),
});

export type ListingRouter = typeof listingRouter;
