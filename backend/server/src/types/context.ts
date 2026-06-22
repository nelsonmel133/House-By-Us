/**
 * tRPC context type definitions.
 *
 * The context is created once per request in `createContext()` (see trpc.ts)
 * and is available to every procedure and middleware.
 */

import type { Request, Response } from "express";
import type { User, Landlord } from "@house-by-us/drizzle";
import type { DB } from "@house-by-us/drizzle";

/**
 * The base context available to all procedures.
 * `user` and `landlord` are null for unauthenticated requests.
 */
export type Context = {
  req: Request;
  res: Response;
  db: DB;
  /** Populated after successful session validation */
  user: User | null;
  /** Populated only when user.role === 'landlord' */
  landlord: Landlord | null;
};

/**
 * Augmented context guaranteed to have an authenticated user.
 * Used by `protectedProcedure`.
 */
export type AuthenticatedContext = Context & {
  user: User;
};

/**
 * Augmented context for landlord-only procedures.
 * Guarantees both user and an approved landlord profile.
 */
export type LandlordContext = AuthenticatedContext & {
  landlord: Landlord;
};

/**
 * Augmented context for admin-only procedures.
 */
export type AdminContext = AuthenticatedContext & {
  user: User & { role: "admin" };
};
