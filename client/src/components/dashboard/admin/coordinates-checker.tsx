import { MapContainer, TileLayer, Marker } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { CheckCircle2, AlertTriangle } from "lucide-react";
import { createListingPinIcon } from "@/components/map/listing-pin";
import type { Listing } from "@/types/domain";

const HARARE_BOUNDS = { minLat: -18.05, maxLat: -17.55, minLng: 30.75, maxLng: 31.35 };

export function CoordinatesChecker({ listing }: { listing: Listing }) {
  const { lat, lng } = listing.coordinates;
  const withinHarareBounds =
    lat >= HARARE_BOUNDS.minLat && lat <= HARARE_BOUNDS.maxLat && lng >= HARARE_BOUNDS.minLng && lng <= HARARE_BOUNDS.maxLng;

  // Chinhoyi listings are intentionally outside Harare proper — treat as a known exception.
  const isExpectedOutOfBounds = listing.area.toLowerCase().includes("chinhoyi");
  const looksValid = withinHarareBounds || isExpectedOutOfBounds;

  return (
    <div className="overflow-hidden rounded-lg border border-ink-900/10">
      <div className="h-48 w-full">
        <MapContainer center={[lat, lng]} zoom={14} className="h-full w-full" zoomControl={false} dragging={false} scrollWheelZoom={false}>
          <TileLayer attribution="&copy; OpenStreetMap" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <Marker position={[lat, lng]} icon={createListingPinIcon({ status: listing.verification, price: "Pin" })} />
        </MapContainer>
      </div>
      <div className={`flex items-center gap-2 px-3 py-2 text-xs font-medium ${looksValid ? "bg-forest-50 text-forest-600" : "bg-clay-50 text-clay-600"}`}>
        {looksValid ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertTriangle className="h-3.5 w-3.5" />}
        {looksValid
          ? `Coordinates fall within expected bounds for ${listing.area}`
          : "Coordinates fall outside expected Harare bounds — verify address manually"}
        <span className="ml-auto font-mono text-[11px] text-ink-400">
          {lat.toFixed(4)}, {lng.toFixed(4)}
        </span>
      </div>
    </div>
  );
}
