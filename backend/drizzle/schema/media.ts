import {
  mysqlTable,
  varchar,
  mysqlEnum,
  int,
  timestamp,
} from "drizzle-orm/mysql-core";
import { relations, sql } from "drizzle-orm";
import { listings } from "./listings";

export const media = mysqlTable("media", {
  id: varchar("id", { length: 36 })
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),

  listingId: varchar("listing_id", { length: 36 }).notNull(),

  /** S3 object key (not the full URL — reconstruct via CloudFront/S3 base URL) */
  s3Key: varchar("s3_key", { length: 1024 }).notNull(),

  /** Public CDN/S3 URL stored for fast reads */
  url: varchar("url", { length: 2048 }).notNull(),

  type: mysqlEnum("type", ["image", "video"]).notNull().default("image"),

  /** Display order (lower = first) */
  order: int("order").notNull().default(0),

  createdAt: timestamp("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const mediaRelations = relations(media, ({ one }) => ({
  listing: one(listings, {
    fields: [media.listingId],
    references: [listings.id],
  }),
}));

export type Media = typeof media.$inferSelect;
export type NewMedia = typeof media.$inferInsert;

