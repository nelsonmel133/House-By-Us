/**
 * Passport.js Google OAuth 2.0 strategy.
 *
 * tRPC procedures cannot perform HTTP redirects, so the OAuth handshake is
 * handled by dedicated Express routes (registered in index.ts) using
 * Passport middleware. Once the callback succeeds, we store `userId` in the
 * express-session, which the tRPC context factory reads on every request.
 *
 * Flow:
 *   1. GET /auth/google            → passport.authenticate('google', {...})
 *   2. User consents on Google's screen
 *   3. GET /auth/google/callback   → passport verifies code, runs verify callback below
 *   4. verify callback upserts the user row, returns user to passport
 *   5. passport.serializeUser stores user.id in req.session
 *   6. Express redirects to CLIENT_URL
 */

import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { eq } from "drizzle-orm";
import { db, users } from "@house-by-us/drizzle";
import { env } from "./env";

passport.use(
  new GoogleStrategy(
    {
      clientID: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      callbackURL: env.GOOGLE_CALLBACK_URL,
      scope: ["profile", "email"],
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;

        if (!email) {
          return done(new Error("Google profile did not return an email address."));
        }

        // ── Upsert pattern: find by oauthId, fall back to email match ──────
        const existing = await db
          .select()
          .from(users)
          .where(eq(users.oauthId, profile.id))
          .limit(1);

        if (existing[0]) {
          return done(null, existing[0]);
        }

        // Check if an account with this email already exists from a
        // different signup path (defensive — shouldn't normally happen
        // since Google is the only auth provider in this implementation)
        const byEmail = await db
          .select()
          .from(users)
          .where(eq(users.email, email))
          .limit(1);

        if (byEmail[0]) {
          return done(null, byEmail[0]);
        }

        // ── Create new user ───────────────────────────────────────────────
        const newUserId = crypto.randomUUID();

        await db.insert(users).values({
          id: newUserId,
          email,
          oauthProvider: "google",
          oauthId: profile.id,
          displayName: profile.displayName,
          avatarUrl: profile.photos?.[0]?.value,
          role: "user",
        });

        const [created] = await db
          .select()
          .from(users)
          .where(eq(users.id, newUserId))
          .limit(1);

        return done(null, created);
      } catch (err) {
        return done(err as Error);
      }
    }
  )
);

// We don't use passport's full session serialization (it expects you to
// store/restore from req.user on every request via its own session store).
// Instead we manage a minimal custom session: just `req.session.userId`.
// These two functions exist to satisfy passport's API but aren't relied upon.
passport.serializeUser((user: any, done) => done(null, user.id));
passport.deserializeUser(async (id: string, done) => {
  try {
    const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
    done(null, user ?? null);
  } catch (err) {
    done(err);
  }
});

export { passport };
