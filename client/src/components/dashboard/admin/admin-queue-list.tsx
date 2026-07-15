import { motion } from "framer-motion";
import { AlertTriangle, FileCheck, Clock } from "lucide-react";
import type { AdminQueueItem } from "@/types/domain";
import { Badge } from "@/components/ui/badge";
import { formatUSD, cn } from "@/lib/utils";

interface AdminQueueListProps {
  items: AdminQueueItem[];
  activeId: string | null;
  onSelect: (id: string) => void;
}

function timeAgo(iso: string): string {
  const hours = Math.round((Date.now() - new Date(iso).getTime()) / 36e5);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

export function AdminQueueList({ items, activeId, onSelect }: AdminQueueListProps) {
  return (
    <div className="divide-y divide-ink-900/6">
      {items.map((item, i) => (
        <motion.button
          key={item.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: i * 0.04 }}
          onClick={() => onSelect(item.id)}
          className={cn(
            "flex w-full items-start gap-3 px-4 py-3.5 text-left transition-colors",
            activeId === item.id ? "bg-clay-50" : "hover:bg-sand-100"
          )}
        >
          <img
            src={item.listing.media[0]?.url}
            alt=""
            className="h-12 w-12 shrink-0 rounded-lg object-cover"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-ink-900">{item.listing.title}</p>
            <p className="text-xs text-ink-400">{item.listing.area} · {formatUSD(item.listing.pricePerMonthUsd)}/mo</p>
            <div className="mt-1.5 flex items-center gap-2">
              {item.flagCount > 0 && (
                <span className="flex items-center gap-0.5 text-[11px] font-medium text-clay-600">
                  <AlertTriangle className="h-3 w-3" /> {item.flagCount} flag{item.flagCount > 1 ? "s" : ""}
                </span>
              )}
              {item.documentsAttached ? (
                <span className="flex items-center gap-0.5 text-[11px] font-medium text-forest-600">
                  <FileCheck className="h-3 w-3" /> Docs attached
                </span>
              ) : (
                <span className="text-[11px] font-medium text-ink-400">No docs</span>
              )}
            </div>
          </div>
          <span className="flex shrink-0 items-center gap-1 text-[11px] text-ink-400">
            <Clock className="h-3 w-3" /> {timeAgo(item.submittedAt)}
          </span>
        </motion.button>
      ))}
      {items.length === 0 && (
        <div className="px-4 py-10 text-center text-sm text-ink-400">Queue is empty — nice work!</div>
      )}
    </div>
  );
}
