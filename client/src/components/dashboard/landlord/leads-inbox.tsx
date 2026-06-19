import { motion } from "framer-motion";
import { MessageSquare, Phone, Clock } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/primitives";
import { Badge } from "@/components/ui/badge";
import type { LeadRequest } from "@/types/domain";
import { initials } from "@/lib/utils";

const STATUS_VARIANT: Record<LeadRequest["status"], "default" | "muted" | "success"> = {
  new: "default",
  responded: "muted",
  closed: "success",
};

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const hours = Math.round(diffMs / 36e5);
  if (hours < 1) return "just now";
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

export function LeadsInbox({ leads }: { leads: LeadRequest[] }) {
  return (
    <div className="divide-y divide-ink-900/6">
      {leads.map((lead, i) => (
        <motion.div
          key={lead.id}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          className="flex items-start gap-3 px-1 py-3.5"
        >
          <Avatar className="h-9 w-9 shrink-0">
            <AvatarImage src={lead.studentAvatarUrl} alt={lead.studentName} />
            <AvatarFallback>{initials(lead.studentName)}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <p className="truncate text-sm font-semibold text-ink-900">{lead.studentName}</p>
              <Badge variant={STATUS_VARIANT[lead.status]} className="shrink-0 capitalize">
                {lead.status}
              </Badge>
            </div>
            <p className="mt-0.5 truncate text-xs text-ink-400">{lead.listingTitle}</p>
            <p className="mt-1.5 line-clamp-2 text-sm text-ink-600">{lead.message}</p>
            <div className="mt-1.5 flex items-center gap-3 text-xs text-ink-400">
              <span className="flex items-center gap-1">
                {lead.channel === "callback" ? <Phone className="h-3 w-3" /> : <MessageSquare className="h-3 w-3" />}
                {lead.channel === "callback" ? "Callback request" : "Message"}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" /> {timeAgo(lead.requestedAt)}
              </span>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
