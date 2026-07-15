/**
 * House-By-Us API Server Entrypoint
 *
 * Wires together:
 *   - Express app with security middleware (helmet, cors)
 *   - express-session for HTTP-only cookie-based auth state
 *   - Passport.js Google OAuth routes (non-tRPC, requires redirects)
 *   - tRPC v11 Express adapter mounted at /trpc
 */

import "./lib/env"; // validates env vars first — crashes early if misconfigured
import "./types/session.d";

import express from "express";
import session from "express-session";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";
import { createExpressMiddleware } from "@trpc/server/adapters/express";

import { env } from "./lib/env";
import { passport } from "./lib/passport";
import { appRouter } from "./routers/_app.router";
import { createContext } from "./middleware/trpc";

const app = express();

// ── Security middleware ────────────────────────────────────────────────────────

app.use(
  helmet({
    // Allow cross-origin requests for the API consumed by a separate client app
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true, // required so the browser sends/receives the session cookie
  })
);

app.use(cookieParser());
app.use(express.json({ limit: "2mb" }));

// ── Session middleware ────────────────────────────────────────────────────────

/**
 * Session cookie configuration:
 *   - httpOnly: true   → inaccessible to client-side JS (XSS mitigation)
 *   - secure: true      → HTTPS only in production
 *   - sameSite: 'lax'   → CSRF mitigation while still allowing OAuth redirects
 *
 * NOTE: The default in-memory session store is for development only.
 * In production, swap to `connect-redis` or `connect-mysql2-session` so
 * sessions survive server restarts and scale across multiple instances:
 *
 *   import RedisStore from "connect-redis";
 *   import Redis from "ioredis";
 *   const redisClient = new Redis(env.REDIS_URL);
 *   app.use(session({ store: new RedisStore({ client: redisClient }), ... }));
 */
app.use(
  session({
    name: "hbu.sid",
    secret: env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    },
  })
);

app.use(passport.initialize());

// ── OAuth routes (Express, not tRPC — requires HTTP redirects) ────────────────

/**
 * GET /auth/google
 * Redirects the user to Google's consent screen.
 */
app.get(
  "/auth/google",
  passport.authenticate("google", { session: false })
);

/**
 * GET /auth/google/callback
 * Google redirects here after user consent. On success, store the user's
 * ID in our custom session and redirect back to the client app.
 */
app.get(
  "/auth/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: `${env.CLIENT_URL}/login?error=oauth_failed`,
  }),
  (req, res) => {
    const user = req.user as { id: string } | undefined;

    if (!user) {
      return res.redirect(`${env.CLIENT_URL}/login?error=oauth_failed`);
    }

    // Regenerate session to prevent session fixation attacks
    req.session.regenerate((err) => {
      if (err) {
        console.error("Session regeneration failed:", err);
        return res.redirect(`${env.CLIENT_URL}/login?error=session_failed`);
      }

      req.session.userId = user.id;
      req.session.save((saveErr) => {
        if (saveErr) {
          console.error("Session save failed:", saveErr);
          return res.redirect(`${env.CLIENT_URL}/login?error=session_failed`);
        }
        res.redirect(`${env.CLIENT_URL}/dashboard`);
      });
    });
  }
);

// ── tRPC middleware ────────────────────────────────────────────────────────────

app.use(
  "/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext,
    onError({ error, path }) {
      // Log all server-side errors centrally; TRPCError messages with
      // intentional user-facing codes (BAD_REQUEST, FORBIDDEN, etc.) are
      // still logged here but already safe to show to the client.
      console.error(`[tRPC error] ${path ?? "<unknown>"}:`, error);
    },
  })
);

// ── Health check ────────────────────────────────────────────────────────────────

app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ── Start server ──────────────────────────────────────────────────────────────

app.listen(env.PORT, () => {
  console.log(`🏠 House-By-Us API listening on port ${env.PORT} (${env.NODE_ENV})`);
  console.log(`   tRPC endpoint: http://localhost:${env.PORT}/trpc`);
  console.log(`   OAuth login:   http://localhost:${env.PORT}/auth/google`);
});
