import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Map as MapIcon, List, Home } from "lucide-react";
import { SearchFilterBar } from "@/components/search/search-filter-bar";
import { ListingCard } from "@/components/search/listing-card";
import { ListingsMap } from "@/components/map/listings-map";
import { Button } from "@/components/ui/button";
import { MOCK_LISTINGS } from "@/lib/mock-data";
import type { SearchFilters } from "@/types/domain";

const DEFAULT_FILTERS: SearchFilters = {
  query: "",
  areas: [],
  priceMin: 0,
  priceMax: 300,
  utilities: [],
  roomTypes: [],
  verifiedOnly: false,
};

export default function SearchPage() {
  const [filters, setFilters] = useState<SearchFilters>(DEFAULT_FILTERS);
  const [activeListingId, setActiveListingId] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<"list" | "map">("list");

  // In production this becomes:
  // const { data, isLoading } = trpc.listings.search.useQuery(filters);
  const filteredListings = useMemo(() => {
    return MOCK_LISTINGS.filter((l) => {
      if (filters.query && !`${l.title} ${l.area} ${l.address}`.toLowerCase().includes(filters.query.toLowerCase()))
        return false;
      if (filters.areas.length > 0 && !filters.areas.includes(l.area)) return false;
      if (l.pricePerMonthUsd < filters.priceMin || l.pricePerMonthUsd > filters.priceMax) return false;
      if (filters.utilities.length > 0 && !filters.utilities.every((u) => l.utilities.includes(u))) return false;
      return true;
    });
  }, [filters]);

  return (
    <div className="flex h-screen flex-col">
      {/* Top bar */}
      <header className="flex items-center justify-between border-b border-ink-900/8 bg-white px-4 py-2.5 md:px-6">
        <a href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-clay-500 text-white">
            <Home className="h-4 w-4" />
          </div>
          <span className="font-display text-lg font-bold tracking-tight text-ink-900">
            House<span className="text-clay-500">-By-Us</span>
          </span>
        </a>
        <div className="hidden items-center gap-3 md:flex">
          <Button variant="ghost" size="sm">List your property</Button>
          <Button variant="default" size="sm">Sign in</Button>
        </div>
      </header>

      <SearchFilterBar filters={filters} onChange={setFilters} resultCount={filteredListings.length} />

      {/* Mobile view toggle */}
      <div className="flex items-center justify-center border-b border-ink-900/8 bg-white py-2 md:hidden">
        <div className="flex rounded-lg bg-sand-200 p-1">
          <button
            onClick={() => setMobileView("list")}
            className={`flex items-center gap-1.5 rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
              mobileView === "list" ? "bg-white text-ink-900 shadow-card" : "text-ink-400"
            }`}
          >
            <List className="h-3.5 w-3.5" /> List
          </button>
          <button
            onClick={() => setMobileView("map")}
            className={`flex items-center gap-1.5 rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
              mobileView === "map" ? "bg-white text-ink-900 shadow-card" : "text-ink-400"
            }`}
          >
            <MapIcon className="h-3.5 w-3.5" /> Map
          </button>
        </div>
      </div>

      {/* Split screen body */}
      <div className="relative flex flex-1 overflow-hidden">
        {/* Listings grid */}
        <div
          className={`w-full overflow-y-auto scrollbar-thin md:block md:w-[46%] lg:w-[42%] ${
            mobileView === "map" ? "hidden" : "block"
          }`}
        >
          <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 md:p-5 lg:grid-cols-2">
            <AnimatePresence mode="popLayout">
              {filteredListings.map((listing) => (
                <ListingCard
                  key={listing.id}
                  listing={listing}
                  isActive={activeListingId === listing.id}
                  onHover={setActiveListingId}
                />
              ))}
            </AnimatePresence>
          </div>
          {filteredListings.length === 0 && (
            <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
              <p className="font-display text-lg font-semibold text-ink-900">No listings match those filters</p>
              <p className="mt-1 text-sm text-ink-400">Try widening your price range or removing an area filter.</p>
              <Button className="mt-4" variant="outline" onClick={() => setFilters(DEFAULT_FILTERS)}>
                Reset filters
              </Button>
            </div>
          )}
        </div>

        {/* Map */}
        <div
          className={`relative flex-1 md:block ${mobileView === "list" ? "hidden" : "block"}`}
        >
          <ListingsMap
            listings={filteredListings}
            activeListingId={activeListingId}
            onMarkerHover={setActiveListingId}
            onMarkerClick={(id) => setActiveListingId(id)}
          />
        </div>
      </div>
    </div>
  );
}
