import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface BarDatum {
  label: string;
  value: number;
  color: string;
}

function BarChart({ data, maxValue }: { data: BarDatum[]; maxValue: number }) {
  return (
    <div className="space-y-3">
      {data.map((d, i) => (
        <div key={d.label}>
          <div className="mb-1 flex items-center justify-between text-xs">
            <span className="font-medium text-ink-600">{d.label}</span>
            <span className="font-mono text-ink-400">{d.value}</span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-sand-200">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(d.value / maxValue) * 100}%` }}
              transition={{ duration: 0.6, delay: i * 0.06, ease: "easeOut" }}
              className="h-full rounded-full"
              style={{ background: d.color }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function DonutBlock({ verified, pending, rejected }: { verified: number; pending: number; rejected: number }) {
  const total = verified + pending + rejected;
  const segments = [
    { value: verified, color: "#1F3D2B" },
    { value: pending, color: "#D4A24C" },
    { value: rejected, color: "#9C9690" },
  ];
  let cumulative = 0;
  const circumference = 2 * Math.PI * 40;

  return (
    <div className="flex items-center gap-5">
      <svg width="104" height="104" viewBox="0 0 104 104" className="-rotate-90">
        <circle cx="52" cy="52" r="40" fill="none" stroke="#F2EBDA" strokeWidth="14" />
        {segments.map((seg, i) => {
          const fraction = seg.value / total;
          const dash = fraction * circumference;
          const offset = (cumulative / total) * circumference;
          cumulative += seg.value;
          return (
            <motion.circle
              key={i}
              cx="52"
              cy="52"
              r="40"
              fill="none"
              stroke={seg.color}
              strokeWidth="14"
              strokeDasharray={`${dash} ${circumference - dash}`}
              strokeDashoffset={-offset}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.15, duration: 0.4 }}
            />
          );
        })}
      </svg>
      <div className="space-y-1.5 text-sm">
        <div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-forest-500" /> Verified ({verified})</div>
        <div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-brass-500" /> Pending ({pending})</div>
        <div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-ink-100" /> Rejected ({rejected})</div>
      </div>
    </div>
  );
}

export function AdminAnalyticsBreakdown() {
  const areaData: BarDatum[] = [
    { label: "Mount Pleasant", value: 34, color: "#C2542D" },
    { label: "Belgravia", value: 28, color: "#C2542D" },
    { label: "Avondale", value: 21, color: "#C2542D" },
    { label: "Hillside", value: 17, color: "#C2542D" },
    { label: "Chinhoyi (CUT)", value: 12, color: "#C2542D" },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Card className="p-5">
        <h3 className="font-display text-base font-semibold text-ink-900">Verification breakdown</h3>
        <p className="mt-0.5 text-xs text-ink-400">Across all submitted listings, all time</p>
        <div className="mt-4">
          <DonutBlock verified={142} pending={6} rejected={9} />
        </div>
      </Card>
      <Card className="p-5">
        <h3 className="font-display text-base font-semibold text-ink-900">Listings by area</h3>
        <p className="mt-0.5 text-xs text-ink-400">Top 5 submitting areas this month</p>
        <div className="mt-4">
          <BarChart data={areaData} maxValue={Math.max(...areaData.map((d) => d.value))} />
        </div>
      </Card>
    </div>
  );
}
