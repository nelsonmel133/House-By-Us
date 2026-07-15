import { useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { useEffect } from "react";
import "leaflet/dist/leaflet.css";
import type { Listing } from "@/types/domain";
import { createListingPinIcon } from "./listing-pin";
import { Badge } from "@/components/ui/badge";
import { Star, ShieldCheck, MapPin } from "lucide-react";
import { formatUSD } from "@/lib/utils";

interface ListingsMapProps {
  listings: Listing[];
  activeListingId: string | null;
  onMarkerHover: (id: string | null) => void;
  onMarkerClick: (id: string) => void;
}

const HARARE_CENTER: [number, number] = [-17.8, 31.04];

function FlyToActive({ listings, activeListingId }: { listings: Listing[]; activeListingId: string | null }) {
  const map = useMap();
  useEffect(() => {
    if (!activeListingId) return;
    const listing = listings.find((l) => l.id === activeListingId);
    if (listing) {
      map.flyTo([listing.coordinates.lat, listing.coordinates.lng], 15, { duration: 0.6 });
    }
  }, [activeListingId, listings, map]);
  return null;
}

export function ListingsMap({ listings, activeListingId, onMarkerHover, onMarkerClick }: ListingsMapProps) {
  const center = useMemo<[number, number]>(() => {
    if (listings.length === 0) return HARARE_CENTER;
    const avgLat = listings.reduce((s, l) => s + l.coordinates.lat, 0) / listings.length;
    const avgLng = listings.reduce((s, l) => s + l.coordinates.lng, 0) / listings.length;
    return [avgLat, avgLng];
  }, [listings]);

  return (
    <MapContainer
      center={center}
      zoom={12}
      scrollWheelZoom
      className="h-full w-full"
      zoomControl={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FlyToActive listings={listings} activeListingId={activeListingId} />
      {listings.map((listing) => (
        <Marker
          key={listing.id}
          position={[listing.coordinates.lat, listing.coordinates.lng]}
          icon={createListingPinIcon({
            status: listing.verification,
            price: `$${listing.pricePerMonthUsd}`,
            active: listing.id === activeListingId,
          })}
          eventHandlers={{
            mouseover: () => onMarkerHover(listing.id),
            mouseout: () => onMarkerHover(null),
            click: () => onMarkerClick(listing.id),
          }}
        >
          <Popup minWidth={260} maxWidth={260}>
            <div className="w-[260px] overflow-hidden">
              <div className="relative h-32 w-full overflow-hidden">
                <img src={listing.media[0]?.url} alt={listing.title} className="h-full w-full object-cover" />
                {listing.verification === "verified" && (
                  <Badge className="absolute left-2 top-2 gap-1" variant="success">
                    <ShieldCheck className="h-3 w-3" /> Verified
                  </Badge>
                )}
              </div>
              <div className="p-3">
                <p className="font-display text-sm font-semibold leading-snug text-ink-900">{listing.title}</p>
                <p className="mt-0.5 flex items-center gap-1 text-xs text-ink-400">
                  <MapPin className="h-3 w-3" /> {listing.area}
                </p>
                <div className="mt-2 flex items-center justify-between">
                  <span className="font-mono text-sm font-bold text-clay-600">
                    {formatUSD(listing.pricePerMonthUsd)}
                    <span className="text-xs font-normal text-ink-400">/mo</span>
                  </span>
                  {listing.rating && (
                    <span className="flex items-center gap-0.5 text-xs text-ink-600">
                      <Star className="h-3 w-3 fill-brass-500 text-brass-500" /> {listing.rating}
                    </span>
                  )}
                </div>
                <a
                  href={`/listings/${listing.id}`}
                  className="mt-2 block rounded-md bg-clay-500 px-3 py-1.5 text-center text-xs font-semibold text-white transition-colors hover:bg-clay-600"
                >
                  View listing
                </a>
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
