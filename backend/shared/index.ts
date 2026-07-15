/**
 * @package @house-by-us/shared
 *
 * Types and constants shared between server, client, and drizzle packages.
 * No runtime dependencies — pure TypeScript.
 */

// ── University locations in Harare (seed data for proximity search) ───────────

export const HARARE_UNIVERSITIES = [
  {
    id: "uz",
    name: "University of Zimbabwe",
    shortName: "UZ",
    latitude: -17.7833,
    longitude: 31.0522,
  },
  {
    id: "nust",
    name: "National University of Science & Technology (Harare Campus)",
    shortName: "NUST",
    latitude: -17.7897,
    longitude: 31.0444,
  },
  {
    id: "hitu",
    name: "Harare Institute of Technology",
    shortName: "HIT",
    latitude: -17.7765,
    longitude: 31.0614,
  },
  {
    id: "msu_harare",
    name: "Midlands State University (Harare Campus)",
    shortName: "MSU",
    latitude: -17.8252,
    longitude: 31.0499,
  },
  {
    id: "zu",
    name: "Zimbabwe University of Livingstonia",
    shortName: "ZUL",
    latitude: -17.7742,
    longitude: 31.0366,
  },
] as const;

export type UniversityId = (typeof HARARE_UNIVERSITIES)[number]["id"];

// ── Subscription tier feature gates ──────────────────────────────────────────

export const SUBSCRIPTION_LIMITS = {
  free: {
    maxListings: 2,
    featuredListings: 0,
    analyticsRetentionDays: 7,
    prioritySupport: false,
  },
  basic: {
    maxListings: 10,
    featuredListings: 1,
    analyticsRetentionDays: 30,
    prioritySupport: false,
  },
  premium: {
    maxListings: Infinity,
    featuredListings: Infinity,
    analyticsRetentionDays: 365,
    prioritySupport: true,
  },
} as const;

export type SubscriptionTier = keyof typeof SUBSCRIPTION_LIMITS;

// ── Platform fee structure (for monetization calculations) ────────────────────

export const PLATFORM_FEES_USD = {
  /** Monthly subscription prices */
  subscriptions: {
    basic: 5,
    premium: 15,
  },
  /** One-off boost add-ons */
  boosts: {
    days7: 3,
    days30: 9,
  },
} as const;

// ── Re-export Amenity type ────────────────────────────────────────────────────

export type { Amenity } from "@house-by-us/drizzle";

