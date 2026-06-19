import { Users, ShieldCheck, Droplets, Sun, Wifi, Zap, Lock, Sofa, BookOpen, ScrollText } from "lucide-react";
import type { Listing, Utility } from "@/types/domain";
import { UTILITY_LABELS } from "@/types/domain";
import { Separator } from "@/components/ui/primitives";

const UTILITY_ICONS: Record<Utility, React.ComponentType<{ className?: string }>> = {
  borehole: Droplets,
  solar: Sun,
  wifi: Wifi,
  prepaid_electricity: Zap,
  security_guard: Lock,
  fenced_yard: ShieldCheck,
  furnished: Sofa,
  study_table: BookOpen,
};

export function ListingSpecsCard({ listing }: { listing: Listing }) {
  return (
    <div className="rounded-xl border border-ink-900/8 bg-white p-5 shadow-card">
      <h2 className="font-display text-lg font-semibold text-ink-900">Specifications</h2>

      <div className="mt-3 flex items-center gap-2 rounded-lg bg-sand-100 px-3 py-2.5">
        <Users className="h-4 w-4 text-forest-600" />
        <span className="text-sm text-ink-800">
          Occupancy limit: <strong>{listing.occupancyLimit}</strong> {listing.occupancyLimit === 1 ? "person" : "people"} ·{" "}
          <span className="capitalize">{listing.roomType.replace("_", " ")}</span>
        </span>
      </div>

      <Separator className="my-4" />

      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-400">Included amenities</p>
      <div className="grid grid-cols-2 gap-2.5">
        {listing.utilities.map((u) => {
          const Icon = UTILITY_ICONS[u];
          return (
            <div key={u} className="flex items-center gap-2 rounded-lg border border-ink-900/6 px-2.5 py-2">
              <Icon className="h-4 w-4 text-clay-500" />
              <span className="text-sm text-ink-800">{UTILITY_LABELS[u]}</span>
            </div>
          );
        })}
      </div>

      <Separator className="my-4" />

      <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-ink-400">
        <ScrollText className="h-3.5 w-3.5" /> House rules
      </p>
      <ul className="space-y-1.5">
        {listing.houseRules.map((rule, i) => (
          <li key={i} className="flex gap-2 text-sm text-ink-600">
            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-ink-400" />
            {rule}
          </li>
        ))}
      </ul>
    </div>
  );
}
