import {
  mysqlTable,
  varchar,
  text,
  boolean,
  timestamp,
} from "drizzle-orm/mysql-core";
import { relations, sql } from "drizzle-orm";
import { users } from "./users";

export type NotificationType =
  | "listing_approved"
  | "listing_rejected"
  | "new_enquiry"
  | "subscription_expiring"
  | "verification_update"
  | "system";

export const notifications = mysqlTable("notifications", {
  id: varchar("id", { length: 36 })
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),

  userId: varchar("user_id", { length: 36 }).notNull(),

  type: varchar("type", { length: 64 })
    .$type<NotificationType>()
    .notNull()
    .default("system"),

  message: text("message").notNull(),

  /** Optional deep-link within the app (e.g. "/listings/abc123") */
  actionUrl: varchar("action_url", { length: 512 }),

  readStatus: boolean("read_status").notNull().default(false),

  createdAt: timestamp("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;

