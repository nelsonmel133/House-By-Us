import { divIcon } from "leaflet";
import { renderToStaticMarkup } from "react-dom/server";
import type { VerificationStatus } from "@/types/domain";

/**
 * Signature element: a teardrop pin with a tiny roofline glyph cut into it —
 * a nod to "House"-By-Us — color-coded by verification status so the map
 * itself communicates trust at a glance, before a single card is opened.
 */
function PinGlyph({ status, active, price }: { status: VerificationStatus; active?: boolean; price: string }) {
  const fill = status === "verified" ? "#1F3D2B" : status === "pending" ? "#D4A24C" : "#9C9690";

  return (
    <div className="flex flex-col items-center" style={{ filter: "drop-shadow(0 2px 6px rgba(28,25,23,0.3))" }}>
      <div
        className={`flex items-center justify-center rounded-full px-2.5 py-1 text-[11px] font-bold font-mono text-white transition-transform ${
          active ? "scale-110" : ""
        }`}
        style={{ background: fill, border: "2px solid white" }}
      >
        {price}
      </div>
      <svg width="20" height="22" viewBox="0 0 20 22" className="-mt-px">
        <path d="M10 22 L2 8 A8 8 0 1 1 18 8 Z" fill={fill} stroke="white" strokeWidth="1.5" />
        {/* roofline glyph */}
        <path d="M6 9.5 L10 6.5 L14 9.5" stroke="white" strokeWidth="1.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="7.3" y="9.3" width="5.4" height="3.4" fill="white" opacity="0.92" rx="0.4" />
      </svg>
    </div>
  );
}

export function createListingPinIcon(opts: { status: VerificationStatus; price: string; active?: boolean }) {
  const html = renderToStaticMarkup(<PinGlyph {...opts} />);
  return divIcon({
    html,
    className: "hbu-pin-icon",
    iconSize: [56, 50],
    iconAnchor: [28, 48],
    popupAnchor: [0, -46],
  });
}
