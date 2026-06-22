import {
  mysqlTable,
  varchar,
  timestamp,
  mysqlEnum,
  json,
  decimal,
  int,
  boolean,
  text,
  float,
} from "drizzle-orm/mysql-core";
import { relations, sql } from "drizzle-orm";
import { landlords } from "./landlords";
import { media } from "./media";
import { approvals } from "./approvals";

/**
 * Known amenity tags used in the `services` JSON array.
 * Frontend should validate against this union.
 */
export type Amenity =
  | "wifi"
  | "solar_power"
  | "borehole_water"
  | "laundry"
  | "security_guard"
  | "cctv"
  | "parking"
  | "kitchen"
  | "furnished"
  | "air_conditioning"
  | "study_room"
  | "backup_generator";

export const listings = mysqlTable("listings", {
  id: varchar("id", { length: 36 })
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),

  landlordId: varchar("landlord_id", { length: 36 }).notNull(),

  title: varchar("title", { length: 255 }).notNull(),

  description: text("description").notNull(),

  address: varchar("address", { length: 512 }).notNull(),

  // Harare coordinate range: lat ≈ -17.8 to -17.7, lng ≈ 31.0 to 31.1
  latitude: float("latitude").notNull(),
  longitude: float("longitude").notNull(),

  /** Price in USD (dominant currency for rentals in ZW since dollarisation) */
  pricePerMonth: decimal("price_per_month", { precision: 10, scale: 2 }).notNull(),

  accommodationType: mysqlEnum("accommodation_type", ["single", "shared"]).notNull(),

  maxOccupancy: int("max_occupancy").notNull().default(1),

  /** JSON array of Amenity strings */
  services: json("services").$type<Amenity[]>().notNull().default([]),

  /** JSON array of house rule strings */
  rules: json("rules").$type<string[]>().notNull().default([]),

  status: mysqlEnum("status", ["pending", "approved", "rejected"])
    .notNull()
    .default("pending"),

  /**
   * MONETIZATION: Featured listings appear at the top of search results.
   * Set to true when landlord pays for a "Boost" add-on (7-day or 30-day).
   * featuredUntil controls the expiry; a cron job flips isFeatured back to false.
   */
  isFeatured: boolean("is_featured").notNull().default(false),
  featuredUntil: timestamp("featured_until"),

  /** How many times this listing has appeared in search results */
  impressionCount: int("impression_count").notNull().default(0),

  /** How many times a student clicked "Contact Landlord" */
  enquiryCount: int("enquiry_count").notNull().default(0),

  createdAt: timestamp("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),

  updatedAt: timestamp("updated_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`)
    .onUpdateNow(),
});

// ── Relations ──────────────────────────────────────────────────────────────────

export const listingsRelations = relations(listings, ({ one, many }) => ({
  landlord: one(landlords, {
    fields: [listings.landlordId],
    references: [landlords.id],
  }),
  media: many(media),
  approvals: many(approvals),
}));

export type Listing = typeof listings.$inferSelect;
export type NewListing = typeof listings.$inferInsert;
