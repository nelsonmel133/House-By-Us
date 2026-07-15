import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { createListingPinIcon } from "@/components/map/listing-pin";

const HARARE_CENTER: [number, number] = [-17.8252, 31.0335];

interface LocationPickerMapProps {
  coordinates: { lat: number; lng: number };
  onChange: (coords: { lat: number; lng: number }) => void;
}

function ClickHandler({ onChange }: { onChange: (c: { lat: number; lng: number }) => void }) {
  useMapEvents({
    click(e) {
      onChange({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

export function LocationPickerMap({ coordinates, onChange }: LocationPickerMapProps) {
  const hasPin = coordinates.lat !== 0 || coordinates.lng !== 0;

  return (
    <div className="overflow-hidden rounded-lg border border-ink-900/10">
      <MapContainer center={hasPin ? [coordinates.lat, coordinates.lng] : HARARE_CENTER} zoom={13} className="h-72 w-full">
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ClickHandler onChange={onChange} />
        {hasPin && (
          <Marker
            position={[coordinates.lat, coordinates.lng]}
            icon={createListingPinIcon({ status: "pending", price: "Here" })}
          />
        )}
      </MapContainer>
    </div>
  );
}
