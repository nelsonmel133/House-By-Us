import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";

// Load env from the server package's .env (shared DB config)
dotenv.config({ path: "../server/.env" });

export default defineConfig({
  schema: "./schema/*",
  out: "./migrations",
  dialect: "mysql",
  dbCredentials: {
    host: process.env.DB_HOST!,
    port: Number(process.env.DB_PORT ?? 3306),
    user: process.env.DB_USER!,
    password: process.env.DB_PASSWORD!,
    database: process.env.DB_NAME!,
  },
  // Verbose output for migration logging
  verbose: true,
  strict: true,
});
