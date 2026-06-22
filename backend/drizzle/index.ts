/**
 * @package @house-by-us/drizzle
 *
 * Central export point for the Drizzle ORM schema and database connection.
 * Import from this package in server code:
 *   import { db, users, listings, ... } from "@house-by-us/drizzle";
 */

import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";

// ── Schema exports ─────────────────────────────────────────────────────────────

export * from "./schema/users";
export * from "./schema/landlords";
export * from "./schema/listings";
export * from "./schema/media";
export * from "./schema/approvals";
export * from "./schema/notifications";

// ── Full schema object (used by Drizzle for relations) ────────────────────────

import * as usersSchema from "./schema/users";
import * as landlordsSchema from "./schema/landlords";
import * as listingsSchema from "./schema/listings";
import * as mediaSchema from "./schema/media";
import * as approvalsSchema from "./schema/approvals";
import * as notificationsSchema from "./schema/notifications";

export const schema = {
  ...usersSchema,
  ...landlordsSchema,
  ...listingsSchema,
  ...mediaSchema,
  ...approvalsSchema,
  ...notificationsSchema,
};

// ── Database connection ────────────────────────────────────────────────────────

/**
 * Create a mysql2 connection pool. All env vars are validated at server startup
 * (see server/src/lib/env.ts). The pool is shared across the entire process.
 */
const pool = mysql.createPool({
  host: process.env.DB_HOST!,
  port: Number(process.env.DB_PORT ?? 3306),
  user: process.env.DB_USER!,
  password: process.env.DB_PASSWORD!,
  database: process.env.DB_NAME!,
  waitForConnections: true,
  connectionLimit: 20,
  queueLimit: 0,
  // Keep-alive to avoid connection drops on free-tier MySQL hosts
  enableKeepAlive: true,
  keepAliveInitialDelay: 10_000,
});

export const db = drizzle(pool, { schema, mode: "default" });
export type DB = typeof db;
