import {
  mysqlTable,
  varchar,
  mysqlEnum,
  text,
  timestamp,
} from "drizzle-orm/mysql-core";
import { relations, sql } from "drizzle-orm";
import { listings } from "./listings";
import { users } from "./users";

export const approvals = mysqlTable("approvals", {
  id: varchar("id", { length: 36 })
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),

  listingId: varchar("listing_id", { length: 36 }).notNull(),

  adminId: varchar("admin_id", { length: 36 }).notNull(),

  status: mysqlEnum("status", ["approved", "rejected"]).notNull(),

  /** Admin's reason / reviewer notes (required on rejection) */
  reason: text("reason"),

  createdAt: timestamp("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const approvalsRelations = relations(approvals, ({ one }) => ({
  listing: one(listings, {
    fields: [approvals.listingId],
    references: [listings.id],
  }),
  admin: one(users, {
    fields: [approvals.adminId],
    references: [users.id],
  }),
}));

export type Approval = typeof approvals.$inferSelect;
export type NewApproval = typeof approvals.$inferInsert;

