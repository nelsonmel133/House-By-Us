/**
 * Ambient mirror of the backend's `AppRouter`.
 *
 * This file bridges the gap while the client runs without the server package
 * installed. In the monorepo, DELETE this file and update the single import
 * in `lib/trpc.ts` to:
 *
 *   import type { AppRouter } from "@house-by-us/server";
 *
 * The shape here mirrors the REAL router namespaces exactly:
 *   - auth.getSession / auth.logout / auth.deleteAccount
 *   - listing.getPublicListings / listing.getListingById / listing.recordEnquiry
 *   - listing.createListing / listing.getUploadUrls / listing.confirmMediaUploads
 *   - listing.getMyListings / listing.updateListing / listing.deleteListing
 *   - landlord.onboard / landlord.getDashboard / landlord.updateProfile
 *   - landlord.getBankDetails / landlord.getNotifications / landlord.markNotificationsRead
 *   - admin.getReviewQueue / admin.reviewListing / admin.getLandlordQueue
 *   - admin.reviewLandlord / admin.getPlatformAnalytics / admin.setFeaturedListing
 */

import { initTRPC } from "@trpc/server";

const t = initTRPC.create();

// ── auth ──────────────────────────────────────────────────────────────────────

const authRouter = t.router({
  getSession: t.procedure.query(
    (): {
      user: {
        id: string;
        email: string;
        displayName: string | null;
        avatarUrl: string | null;
        role: "user" | "landlord" | "admin";
        createdAt: Date;
      } | null;
      landlord: {
        id: string;
        businessName: string;
        verificationStatus: "pending" | "approved" | "rejected";
        subscriptionTier: "free" | "basic" | "premium";
        subscriptionExpiresAt: Date | null;
      } | null;
    } => ({ user: null, landlord: null })
  ),

  logout: t.procedure.mutation((): { success: boolean } => ({ success: true })),

  deleteAccount: t.procedure
    .input((v: unknown) => v as { confirmEmail: string })
    .mutation((): { success: boolean } => ({ success: true })),
});

// ── listing ───────────────────────────────────────────────────────────────────

type Amenity =
  | "wifi" | "solar_power" | "borehole_water" | "laundry"
  | "security_guard" | "cctv" | "parking" | "kitchen"
  | "furnished" | "air_conditioning" | "study_room" | "backup_generator";

type MediaRow = {
  id: string;
  listingId: string;
  s3Key: string;
  url: string;
  type: "image" | "video";
  order: number;
  createdAt: Date;
};

type ListingRow = {
  id: string;
  landlordId: string;
  title: string;
  description: string;
  address: string;
  latitude: number;
  longitude: number;
  pricePerMonth: string;
  accommodationType: "single" | "shared";
  maxOccupancy: number;
  services: Amenity[];
  rules: string[];
  status: "pending" | "approved" | "rejected";
  isFeatured: boolean;
  featuredUntil: Date | null;
  impressionCount: number;
  enquiryCount: number;
  createdAt: Date;
  updatedAt: Date;
  media: MediaRow[];
  distanceKm?: number | null;
};

const listingRouter = t.router({
  createListing: t.procedure
    .input(
      (v: unknown) =>
        v as {
          title: string;
          description: string;
          address: string;
          latitude: number;
          longitude: number;
          pricePerMonth: number;
          accommodationType: "single" | "shared";
          maxOccupancy: number;
          services: Amenity[];
          rules: string[];
        }
    )
    .mutation((): { listingId: string } => ({ listingId: "" })),

  getUploadUrls: t.procedure
    .input(
      (v: unknown) =>
        v as {
          listingId: string;
          files: { mimeType: string; fileSizeBytes: number }[];
        }
    )
    .mutation(
      (): {
        uploads: {
          uploadUrl: string;
          s3Key: string;
          publicUrl: string;
          expiresAt: Date;
        }[];
      } => ({ uploads: [] })
    ),

  confirmMediaUploads: t.procedure
    .input(
      (v: unknown) =>
        v as {
          listingId: string;
          media: { s3Key: string; publicUrl: string; type: "image" | "video"; order: number }[];
        }
    )
    .mutation((): { success: boolean } => ({ success: true })),

  getMyListings: t.procedure.query((): ListingRow[] => []),

  updateListing: t.procedure
    .input((v: unknown) => v as { listingId: string; [key: string]: unknown })
    .mutation((): { success: boolean } => ({ success: true })),

  deleteListing: t.procedure
    .input((v: unknown) => v as { listingId: string })
    .mutation((): { success: boolean } => ({ success: true })),

  getPublicListings: t.procedure
    .input(
      (v: unknown) =>
        v as {
          latitude?: number;
          longitude?: number;
          radiusKm?: number;
          minPrice?: number;
          maxPrice?: number;
          accommodationType?: "single" | "shared";
          amenities?: Amenity[];
          limit?: number;
          offset?: number;
          sortBy?: "price_asc" | "price_desc" | "newest" | "distance";
        }
    )
    .query((): { items: ListingRow[]; hasMore: boolean; total: number } => ({
      items: [],
      hasMore: false,
      total: 0,
    })),

  getListingById: t.procedure
    .input((v: unknown) => v as { listingId: string })
    .query(
      (): ListingRow & {
        landlord: { businessName: string; phoneNumber: string | null; verificationStatus: string } | null;
      } => ({
        id: "",
        landlordId: "",
        title: "",
        description: "",
        address: "",
        latitude: 0,
        longitude: 0,
        pricePerMonth: "0",
        accommodationType: "single",
        maxOccupancy: 1,
        services: [],
        rules: [],
        status: "approved",
        isFeatured: false,
        featuredUntil: null,
        impressionCount: 0,
        enquiryCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        media: [],
        landlord: null,
      })
    ),

  recordEnquiry: t.procedure
    .input((v: unknown) => v as { listingId: string })
    .mutation((): { success: boolean } => ({ success: true })),
});

// ── landlord ──────────────────────────────────────────────────────────────────

type NotificationRow = {
  id: string;
  userId: string;
  type: string;
  message: string;
  actionUrl: string | null;
  readStatus: boolean;
  createdAt: Date;
};

const landlordRouter = t.router({
  onboard: t.procedure
    .input(
      (v: unknown) =>
        v as {
          businessName: string;
          phoneNumber: string;
          bankDetails: {
            provider: string;
            accountName: string;
            accountNumber: string;
            branchCode?: string;
            swiftCode?: string;
          };
        }
    )
    .mutation((): { success: boolean } => ({ success: true })),

  getDashboard: t.procedure.query(
    (): {
      totalListings: number;
      activeListings: number;
      pendingListings: number;
      rejectedListings: number;
      featuredListings: number;
      totalEnquiries: number;
      totalImpressions: number;
      estimatedMonthlyRevenue: number;
      subscription: {
        tier: "free" | "basic" | "premium";
        expiresAt: Date | null;
        limits: { maxListings: number | null; featuredListings: number | null };
        nearListingLimit: boolean;
      };
    } => ({
      totalListings: 0,
      activeListings: 0,
      pendingListings: 0,
      rejectedListings: 0,
      featuredListings: 0,
      totalEnquiries: 0,
      totalImpressions: 0,
      estimatedMonthlyRevenue: 0,
      subscription: {
        tier: "free",
        expiresAt: null,
        limits: { maxListings: 2, featuredListings: 0 },
        nearListingLimit: false,
      },
    })
  ),

  updateProfile: t.procedure
    .input(
      (v: unknown) =>
        v as {
          businessName?: string;
          phoneNumber?: string;
          bankDetails?: { provider: string; accountName: string; accountNumber: string };
        }
    )
    .mutation((): { success: boolean } => ({ success: true })),

  getBankDetails: t.procedure.query(
    (): {
      bankDetails: { provider: string; accountName: string; accountNumber: string } | null;
    } => ({ bankDetails: null })
  ),

  getNotifications: t.procedure
    .input((v: unknown) => v as { limit?: number; cursor?: string })
    .query(
      (): { items: NotificationRow[]; nextCursor: string | undefined } => ({
        items: [],
        nextCursor: undefined,
      })
    ),

  markNotificationsRead: t.procedure.mutation(
    (): { success: boolean } => ({ success: true })
  ),
});

// ── admin ─────────────────────────────────────────────────────────────────────

const adminRouter = t.router({
  getReviewQueue: t.procedure
    .input((v: unknown) => v as { limit?: number; offset?: number })
    .query(
      (): { items: ListingRow[]; total: number; hasMore: boolean } => ({
        items: [],
        total: 0,
        hasMore: false,
      })
    ),

  reviewListing: t.procedure
    .input(
      (v: unknown) =>
        v as { listingId: string; status: "approved" | "rejected"; reason?: string }
    )
    .mutation((): { success: boolean } => ({ success: true })),

  getLandlordQueue: t.procedure
    .input((v: unknown) => v as { limit?: number; offset?: number })
    .query((): { items: unknown[]; total: number; hasMore: boolean } => ({
      items: [],
      total: 0,
      hasMore: false,
    })),

  reviewLandlord: t.procedure
    .input(
      (v: unknown) =>
        v as { landlordId: string; status: "approved" | "rejected"; notes?: string }
    )
    .mutation((): { success: boolean } => ({ success: true })),

  getPlatformAnalytics: t.procedure.query(
    (): {
      users: { total: number; students: number; landlords: number; admins: number; newLandlordSignups30d: number };
      listings: { total: number; pending: number; approved: number; rejected: number };
      monetization: {
        subscriptionTierDistribution: { free: number; basic: number; premium: number };
        estimatedMRR_USD: number;
        estimatedPlatformRevenueNote: string;
      };
      geoDistribution: { latitude: number; longitude: number; listingCount: number }[];
    } => ({
      users: { total: 0, students: 0, landlords: 0, admins: 0, newLandlordSignups30d: 0 },
      listings: { total: 0, pending: 0, approved: 0, rejected: 0 },
      monetization: {
        subscriptionTierDistribution: { free: 0, basic: 0, premium: 0 },
        estimatedMRR_USD: 0,
        estimatedPlatformRevenueNote: "",
      },
      geoDistribution: [],
    })
  ),

  setFeaturedListing: t.procedure
    .input(
      (v: unknown) =>
        v as { listingId: string; isFeatured: boolean; featuredDays?: number }
    )
    .mutation(
      (): { success: boolean; featuredUntil: Date | null } => ({
        success: true,
        featuredUntil: null,
      })
    ),
});

// ── Root ──────────────────────────────────────────────────────────────────────

const appRouter = t.router({
  auth: authRouter,
  listing: listingRouter,
  landlord: landlordRouter,
  admin: adminRouter,
});

export type AppRouter = typeof appRouter;
