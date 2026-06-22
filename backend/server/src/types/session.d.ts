/**
 * Augments express-session's SessionData interface so `req.session.userId`
 * is properly typed throughout the codebase instead of requiring `any`.
 */

import "express-session";

declare module "express-session" {
  interface SessionData {
    userId?: string;
  }
}
