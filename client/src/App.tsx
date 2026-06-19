import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { trpc, getTrpcClient, queryClient } from "@/lib/trpc";
import { TooltipProvider } from "@/components/ui/primitives";
import SearchPage from "@/pages/search";
import ListingDetailPage from "@/pages/listing-detail";
import LandlordDashboardPage from "@/pages/dashboard-landlord";
import AdminDashboardPage from "@/pages/dashboard-admin";

function NotFound() {
  return (
    <div className="flex h-screen flex-col items-center justify-center bg-sand-100 px-6 text-center">
      <h1 className="font-display text-4xl font-bold text-ink-900">404</h1>
      <p className="mt-2 text-ink-400">This page doesn't exist. Try heading back to search.</p>
      <a href="/search" className="mt-4 rounded-md bg-clay-500 px-4 py-2 text-sm font-semibold text-white hover:bg-clay-600">
        Go to search
      </a>
    </div>
  );
}

export default function App() {
  return (
    <trpc.Provider client={getTrpcClient()} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Switch>
            <Route path="/" component={SearchPage} />
            <Route path="/search" component={SearchPage} />
            <Route path="/listings/:id" component={ListingDetailPage} />
            <Route path="/dashboard/landlord" component={LandlordDashboardPage} />
            <Route path="/dashboard/admin" component={AdminDashboardPage} />
            <Route component={NotFound} />
          </Switch>
        </TooltipProvider>
      </QueryClientProvider>
    </trpc.Provider>
  );
}
