import { mysqlTable, varchar, timestamp, mysqlEnum } from "drizzle-orm/mysql-core";
import { relations, sql } from "drizzle-orm";
import { landlords } from "./landlords";
import { notifications } from "./notifications";

export const users = mysqlTable("users", {
  id: varchar("id", { length: 36 })
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),

  email: varchar("email", { length: 255 }).notNull().unique(),

  // OAuth provider fields
  oauthProvider: varchar("oauth_provider", { length: 50 }).notNull(), // 'google' | 'github'
  oauthId: varchar("oauth_id", { length: 255 }).notNull(),

  displayName: varchar("display_name", { length: 255 }),
  avatarUrl: varchar("avatar_url", { length: 2048 }),

  role: mysqlEnum("role", ["user", "landlord", "admin"])
    .notNull()
    .default("user"),

  createdAt: timestamp("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),

  updatedAt: timestamp("updated_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`)
    .onUpdateNow(),
});

// ── Relations ──────────────────────────────────────────────────────────────────

export const usersRelations = relations(users, ({ one, many }) => ({
  landlordProfile: one(landlords, {
    fields: [users.id],
    references: [landlords.userId],
  }),
  notifications: many(notifications),
}));

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

