import {
  mysqlTable,
  varchar,
  timestamp,
  mysqlEnum,
} from "drizzle-orm/mysql-core";
import { relations, sql } from "drizzle-orm";
import { users } from "./users";
import { listings } from "./listings";

/**
 * Bank details JSON shape for Zimbabwean banks and mobile money platforms.
 * Stored as encrypted JSON (AES-256-GCM at application layer before insert).
 *
 * Supported providers:
 *   - ZB Bank, CBZ, Stanbic, FBC (traditional banking)
 *   - EcoCash, OneMoney, InnBucks (mobile money — very dominant in ZW)
 */
export type ZWBankDetails = {
  provider: string;         // e.g. "EcoCash" | "CBZ Bank" | "ZB Bank"
  accountName: string;
  accountNumber: string;    // IBAN / mobile number / account number
  branchCode?: string;      // Optional for traditional banks
  swiftCode?: string;       // Optional for international transfers
};

export const landlords = mysqlTable("landlords", {
  id: varchar("id", { length: 36 })
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),

  userId: varchar("user_id", { length: 36 })
    .notNull()
    .unique(), // 1:1 with users

  businessName: varchar("business_name", { length: 255 }).notNull(),

  phoneNumber: varchar("phone_number", { length: 20 }),

  /**
   * Encrypted JSON blob. Encrypt at the application layer (lib/crypto.ts)
   * before storing and decrypt after fetching. Never log raw bank details.
   */
  bankDetailsEncrypted: varchar("bank_details_encrypted", { length: 4096 }),

  verificationStatus: mysqlEnum("verification_status", [
    "pending",
    "approved",
    "rejected",
  ])
    .notNull()
    .default("pending"),

  verificationNotes: varchar("verification_notes", { length: 1024 }),

  /**
   * MONETIZATION: subscription tier controls feature access.
   *   - "free"    → max 2 active listings, no featured placement
   *   - "basic"   → max 10 listings, standard placement
   *   - "premium" → unlimited listings, priority search placement bump
   *
   * Tier is set after payment confirmation via payment webhook handler.
   */
  subscriptionTier: mysqlEnum("subscription_tier", [
    "free",
    "basic",
    "premium",
  ])
    .notNull()
    .default("free"),

  subscriptionExpiresAt: timestamp("subscription_expires_at"),

  createdAt: timestamp("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),

  updatedAt: timestamp("updated_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`)
    .onUpdateNow(),
});

// ── Relations ──────────────────────────────────────────────────────────────────

export const landlordsRelations = relations(landlords, ({ one, many }) => ({
  user: one(users, {
    fields: [landlords.userId],
    references: [users.id],
  }),
  listings: many(listings),
}));

export type Landlord = typeof landlords.$inferSelect;
export type NewLandlord = typeof landlords.$inferInsert;

