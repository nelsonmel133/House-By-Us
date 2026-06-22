/**
 * Validates all required environment variables at startup.
 * The process will crash immediately with a helpful error if any are missing,
 * rather than failing silently at runtime.
 */

import { z } from "zod";

const envSchema = z.object({
  // ── Server ─────────────────────────────────────────────────────────────────
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.coerce.number().default(4000),

  // ── Database ───────────────────────────────────────────────────────────────
  DB_HOST: z.string().min(1),
  DB_PORT: z.coerce.number().default(3306),
  DB_USER: z.string().min(1),
  DB_PASSWORD: z.string().min(1),
  DB_NAME: z.string().min(1),

  // ── Session ────────────────────────────────────────────────────────────────
  SESSION_SECRET: z.string().min(32, "SESSION_SECRET must be at least 32 chars"),

  // ── OAuth — Google ─────────────────────────────────────────────────────────
  GOOGLE_CLIENT_ID: z.string().min(1),
  GOOGLE_CLIENT_SECRET: z.string().min(1),
  GOOGLE_CALLBACK_URL: z.string().url(),

  // ── AWS S3 ─────────────────────────────────────────────────────────────────
  AWS_REGION: z.string().default("af-south-1"),
  AWS_ACCESS_KEY_ID: z.string().min(1),
  AWS_SECRET_ACCESS_KEY: z.string().min(1),
  S3_BUCKET_NAME: z.string().min(1),
  /** CloudFront or S3 base URL for constructing public media URLs */
  MEDIA_BASE_URL: z.string().url(),

  // ── App ────────────────────────────────────────────────────────────────────
  CLIENT_URL: z.string().url(),

  // ── Encryption (for bank details AES-256-GCM) ──────────────────────────────
  ENCRYPTION_KEY: z
    .string()
    .length(64, "ENCRYPTION_KEY must be a 64-char hex string (32 bytes)"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error(
    "❌ Invalid environment variables:\n",
    parsed.error.flatten().fieldErrors
  );
  process.exit(1);
}

export const env = parsed.data;
export type Env = typeof env;
