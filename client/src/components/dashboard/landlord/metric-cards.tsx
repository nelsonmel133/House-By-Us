import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Eye, Users, DollarSign, TrendingUp, TrendingDown, Home } from "lucide-react";
import type { LandlordDashboardMetrics } from "@/types/domain";
import { formatCompactNumber, formatUSD, cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";

function useCountUp(target: number, duration = 900) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let start: number | null = null;
    let raf: number;
    function tick(ts: number) {
      if (start === null) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      setValue(Math.round(target * (1 - Math.pow(1 - progress, 3))));
      if (progress < 1) raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return value;
}

interface MetricCardProps {
  label: string;
  value: number;
  deltaPct: number;
  icon: React.ComponentType<{ className?: string }>;
  format: "compact" | "usd";
  accent: "clay" | "forest" | "brass";
}

function MetricCard({ label, value, deltaPct, icon: Icon, format, accent }: MetricCardProps) {
  const animated = useCountUp(value);
  const isPositive = deltaPct >= 0;
  const accentClasses = {
    clay: "bg-clay-50 text-clay-600",
    forest: "bg-forest-50 text-forest-600",
    brass: "bg-brass-300/30 text-brass-600",
  }[accent];

  return (
    <Card className="overflow-hidden p-5">
      <div className="flex items-center justify-between">
        <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg", accentClasses)}>
          <Icon className="h-5 w-5" />
        </div>
        <span
          className={cn(
            "flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold",
            isPositive ? "bg-forest-50 text-forest-600" : "bg-clay-50 text-clay-600"
          )}
        >
          {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
          {Math.abs(deltaPct)}%
        </span>
      </div>
      <p className="mt-4 font-mono text-2xl font-bold text-ink-900">
        {format === "usd" ? formatUSD(animated) : formatCompactNumber(animated)}
      </p>
      <p className="mt-0.5 text-sm text-ink-400">{label}</p>
    </Card>
  );
}

export function MetricCardsRow({ metrics }: { metrics: LandlordDashboardMetrics }) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{ visible: { transition: { staggerChildren: 0.07 } } }}
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
    >
      {[
        { label: "Total views", value: metrics.totalViews, deltaPct: metrics.viewsDeltaPct, icon: Eye, format: "compact" as const, accent: "clay" as const },
        { label: "Leads received", value: metrics.totalLeads, deltaPct: metrics.leadsDeltaPct, icon: Users, format: "compact" as const, accent: "forest" as const },
        { label: "Earnings this month", value: metrics.earningsUsd, deltaPct: metrics.earningsDeltaPct, icon: DollarSign, format: "usd" as const, accent: "brass" as const },
        { label: "Active listings", value: metrics.activeListings, deltaPct: 0, icon: Home, format: "compact" as const, accent: "clay" as const },
      ].map((m) => (
        <motion.div key={m.label} variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}>
          <MetricCard {...m} />
        </motion.div>
      ))}
    </motion.div>
  );
}
