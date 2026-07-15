import { motion } from "framer-motion";
import { Link } from "wouter";
import { ShieldCheck, Star, MapPin, Droplets, Sun, Wifi, Clock } from "lucide-react";
import type { Listing } from "@/types/domain";
import { formatUSD, cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface ListingCardProps {
  listing: Listing;
  isActive: boolean;
  onHover: (id: string | null) => void;
}

const utilityIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  borehole: Droplets,
  solar: Sun,
  wifi: Wifi,
};

export function ListingCard({ listing, isActive, onHover }: ListingCardProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      onMouseEnter={() => onHover(listing.id)}
      onMouseLeave={() => onHover(null)}
      className={cn(
        "group relative overflow-hidden rounded-xl border bg-white shadow-card transition-all duration-200",
        isActive ? "border-clay-400 shadow-card-hover ring-1 ring-clay-400/40" : "border-ink-900/8 hover:shadow-card-hover"
      )}
    >
      <Link href={`/listings/${listing.id}`} className="block">
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-sand-200">
          <img
            src={listing.media[0]?.url}
            alt={listing.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
          {/* Verification ribbon - corner-fold detail referencing official seals */}
          {listing.verification === "verified" && (
            <div className="absolute -left-1 top-3 flex items-center gap-1 bg-forest-500 px-3 py-1 text-[11px] font-semibold text-white shadow-pin">
              <ShieldCheck className="h-3 w-3" /> Verified
              <div className="absolute -left-0 -bottom-1 h-0 w-0 border-l-[4px] border-t-[4px] border-l-transparent border-t-forest-800" />
            </div>
          )}
          {listing.verification === "pending" && (
            <Badge variant="warning" className="absolute left-3 top-3">
              Pending review
            </Badge>
          )}
          <div className="absolute bottom-2 right-2 rounded-md bg-ink-900/75 px-2 py-1 font-mono text-xs font-bold text-white backdrop-blur-sm">
            {formatUSD(listing.pricePerMonthUsd)}<span className="font-normal text-white/70">/mo</span>
          </div>
        </div>

        <div className="p-3.5">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-display text-[15px] font-semibold leading-snug text-ink-900">{listing.title}</h3>
            {listing.rating && (
              <span className="flex shrink-0 items-center gap-0.5 text-xs font-medium text-ink-600">
                <Star className="h-3.5 w-3.5 fill-brass-500 text-brass-500" /> {listing.rating}
              </span>
            )}
          </div>
          <p className="mt-1 flex items-center gap-1 text-xs text-ink-400">
            <MapPin className="h-3 w-3" /> {listing.area}
            {listing.distanceToCampusKm != null && (
              <span className="ml-1 flex items-center gap-0.5 text-ink-400">
                · <Clock className="h-3 w-3" /> {listing.distanceToCampusKm} km to campus
              </span>
            )}
          </p>

          <div className="mt-2.5 flex items-center gap-2.5">
            {listing.utilities.slice(0, 3).map((u) => {
              const Icon = utilityIcons[u];
              if (!Icon) return null;
              return (
                <span key={u} className="flex items-center gap-1 text-[11px] text-forest-600">
                  <Icon className="h-3.5 w-3.5" />
                </span>
              );
            })}
            <span className="text-[11px] capitalize text-ink-400">{listing.roomType.replace("_", " ")}</span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
