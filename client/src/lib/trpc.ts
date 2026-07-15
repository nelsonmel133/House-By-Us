import { createTRPCReact } from "@trpc/react-query";
import { httpBatchLink } from "@trpc/client";
import { QueryClient } from "@tanstack/react-query";

/**
 * The backend exports `AppRouter` from `server/src/router.ts`. We import only
 * the TYPE (never the implementation) so the client bundle stays free of
 * server code while still getting full end-to-end type inference for every
 * query/mutation input and output below.
 *
 *   export type { AppRouter } from "@house-by-us/server";
 *
 * In this standalone frontend deliverable the server package isn't present,
 * so we declare a structurally-equivalent ambient type. Swap this for the
 * real import in the monorepo — no other file needs to change.
 */
import type { AppRouter } from "./trpc-router-types";

export const trpc = createTRPCReact<AppRouter>();

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export function getTrpcClient() {
  return trpc.createClient({
    links: [
      httpBatchLink({
        url: import.meta.env.VITE_API_URL ?? "/api/trpc",
        headers() {
          const token = localStorage.getItem("hbu_session_token");
          return token ? { authorization: `Bearer ${token}` } : {};
        },
      }),
    ],
  });
}
