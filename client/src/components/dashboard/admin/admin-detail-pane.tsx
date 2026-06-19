import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, ShieldCheck, ShieldAlert, MapPin, Image as ImageIcon, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/primitives";
import { CoordinatesChecker } from "./coordinates-checker";
import { RejectionReasonModal } from "./rejection-reason-modal";
import type { AdminQueueItem } from "@/types/domain";
import { formatUSD } from "@/lib/utils";

interface AdminDetailPaneProps {
  item: AdminQueueItem | null;
  onApprove: (id: string) => void;
  onReject: (id: string, reason: string) => void;
}

export function AdminDetailPane({ item, onApprove, onReject }: AdminDetailPaneProps) {
  const [rejectOpen, setRejectOpen] = useState(false);
  const [decision, setDecision] = useState<"approved" | "rejected" | null>(null);

  if (!item) {
    return (
      <div className="flex h-full flex-col items-center justify-center px-6 text-center text-ink-400">
        <ShieldCheck className="h-10 w-10 opacity-40" />
        <p className="mt-3 text-sm">Select a listing from the queue to review it</p>
      </div>
    );
  }

  const { listing } = item;

  function handleApprove() {
    if (!item) return;
    setDecision("approved");
    onApprove(item.id);
  }

  function handleReject(reason: string) {
    if (!item) return;
    setRejectOpen(false);
    setDecision("rejected");
    onReject(item.id, reason);
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto scrollbar-thin p-6">
        <AnimatePresence mode="wait">
          <motion.div key={item.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-display text-xl font-bold text-ink-900">{listing.title}</h2>
                <p className="mt-1 flex items-center gap-1.5 text-sm text-ink-400">
                  <MapPin className="h-3.5 w-3.5" /> {listing.address}
                </p>
              </div>
              <span className="shrink-0 font-mono text-lg font-bold text-clay-600">
                {formatUSD(listing.pricePerMonthUsd)}<span className="text-xs font-normal text-ink-400">/mo</span>
              </span>
            </div>

            {decision && (
              <div
                className={`mt-4 flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium ${
                  decision === "approved" ? "bg-forest-50 text-forest-700" : "bg-clay-50 text-clay-700"
                }`}
              >
                {decision === "approved" ? <ShieldCheck className="h-4 w-4" /> : <ShieldAlert className="h-4 w-4" />}
                This listing has been {decision}.
              </div>
            )}

            {/* Photo validation */}
            <div className="mt-6">
              <h3 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-ink-400">
                <ImageIcon className="h-3.5 w-3.5" /> Photo validation ({listing.media.length})
              </h3>
              <div className="grid grid-cols-4 gap-2">
                {listing.media.map((m) => (
                  <div key={m.id} className="aspect-square overflow-hidden rounded-md border border-ink-900/10">
                    <img src={m.url} alt="" className="h-full w-full object-cover" />
                  </div>
                ))}
              </div>
              {listing.media.length < 3 && (
                <p className="mt-2 text-xs font-medium text-clay-600">⚠ Fewer than 3 photos — consider flagging for more media.</p>
              )}
            </div>

            {/* Coordinates checker */}
            <div className="mt-6">
              <h3 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-ink-400">
                <MapPin className="h-3.5 w-3.5" /> Map coordinates checker
              </h3>
              <CoordinatesChecker listing={listing} />
            </div>

            {/* Documents */}
            <div className="mt-6">
              <h3 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-ink-400">
                <FileText className="h-3.5 w-3.5" /> Supporting documents
              </h3>
              {item.documentsAttached ? (
                <div className="flex items-center gap-2 rounded-lg border border-ink-900/10 px-3 py-2.5 text-sm">
                  <FileText className="h-4 w-4 text-forest-600" /> proof_of_ownership.pdf
                  <Badge variant="success" className="ml-auto">Attached</Badge>
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-clay-300 bg-clay-50 px-3 py-2.5 text-sm text-clay-600">
                  No supporting documents attached — flag for follow-up.
                </div>
              )}
            </div>

            <Separator className="my-6" />

            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-400">Landlord</h3>
              <div className="flex items-center gap-3 rounded-lg border border-ink-900/8 px-3 py-2.5">
                <img src={listing.landlord.avatarUrl} alt="" className="h-9 w-9 rounded-full object-cover" />
                <div>
                  <p className="text-sm font-semibold text-ink-900">{listing.landlord.name}</p>
                  <p className="text-xs text-ink-400">
                    Member since {new Date(listing.landlord.memberSince).getFullYear()} · {listing.landlord.responseRateApprox}% response rate
                  </p>
                </div>
                {listing.landlord.isVerified ? (
                  <Badge variant="success" className="ml-auto">Verified ID</Badge>
                ) : (
                  <Badge variant="muted" className="ml-auto">Unverified</Badge>
                )}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {!decision && (
        <div className="flex items-center gap-3 border-t border-ink-900/8 bg-white p-4">
          <Button variant="destructive" className="flex-1 gap-1.5" onClick={() => setRejectOpen(true)}>
            <X className="h-4 w-4" /> Reject
          </Button>
          <Button variant="secondary" className="flex-1 gap-1.5" onClick={handleApprove}>
            <Check className="h-4 w-4" /> Approve
          </Button>
        </div>
      )}

      <RejectionReasonModal
        open={rejectOpen}
        onOpenChange={setRejectOpen}
        listingTitle={listing.title}
        onConfirm={handleReject}
      />
    </div>
  );
}
