import { useState } from "react";
import { AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface RejectionReasonModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  listingTitle: string;
  onConfirm: (reason: string) => void;
}

const COMMON_REASONS = [
  "Photos do not match the address provided",
  "Missing proof of ownership / lease agreement",
  "Pricing appears inconsistent with the area",
  "Coordinates do not match the listed address",
];

export function RejectionReasonModal({ open, onOpenChange, listingTitle, onConfirm }: RejectionReasonModalProps) {
  const [reason, setReason] = useState("");
  const [touched, setTouched] = useState(false);

  const isValid = reason.trim().length >= 12;

  function handleConfirm() {
    setTouched(true);
    if (!isValid) return;
    onConfirm(reason.trim());
    setReason("");
    setTouched(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" /> Reject listing
          </DialogTitle>
          <DialogDescription>
            You're rejecting "{listingTitle}". The landlord will see this reason, so please be specific and constructive.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="reason">Rejection reason (required)</Label>
          <textarea
            id="reason"
            rows={4}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Explain what needs to change before this listing can be approved..."
            className="w-full rounded-md border border-ink-900/15 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-destructive"
          />
          {touched && !isValid && (
            <p className="text-xs text-destructive">Please provide a specific reason (at least 12 characters).</p>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5">
          {COMMON_REASONS.map((r) => (
            <button
              key={r}
              onClick={() => setReason(r)}
              className="rounded-full border border-ink-900/12 px-2.5 py-1 text-xs text-ink-600 hover:bg-sand-100"
            >
              {r}
            </button>
          ))}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleConfirm}>
            Confirm rejection
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
