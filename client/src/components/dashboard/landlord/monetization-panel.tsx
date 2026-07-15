import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Rocket, ShieldCheck as ShieldIcon, Star, CheckCircle2, Loader2, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import type { MonetizationBoost } from "@/types/domain";
import { MOCK_BOOSTS, MOCK_LISTINGS } from "@/lib/mock-data";
import { cn, formatUSD } from "@/lib/utils";

const ICONS: Record<MonetizationBoost["icon"], React.ComponentType<{ className?: string }>> = {
  rocket: Rocket,
  shield: ShieldIcon,
  star: Star,
};

const ICON_BG: Record<MonetizationBoost["icon"], string> = {
  rocket: "bg-clay-50 text-clay-600",
  shield: "bg-forest-50 text-forest-600",
  star: "bg-brass-300/30 text-brass-600",
};

type CheckoutState = "select_listing" | "processing" | "success";

export function MonetizationPanel() {
  const [selectedBoost, setSelectedBoost] = useState<MonetizationBoost | null>(null);
  const [checkoutState, setCheckoutState] = useState<CheckoutState>("select_listing");
  const [selectedListingId, setSelectedListingId] = useState<string>("");

  function openCheckout(boost: MonetizationBoost) {
    setSelectedBoost(boost);
    setCheckoutState("select_listing");
    setSelectedListingId("");
  }

  async function confirmPurchase() {
    setCheckoutState("processing");
    // trpc.landlordDashboard.purchaseBoost.mutate({ boostId, listingId }) -> { checkoutUrl }
    await new Promise((r) => setTimeout(r, 1100));
    setCheckoutState("success");
  }

  return (
    <div>
      <div className="mb-4 flex items-baseline justify-between">
        <div>
          <h2 className="font-display text-lg font-semibold text-ink-900">Boost your visibility</h2>
          <p className="text-sm text-ink-400">Get more eyes on your listings with premium placement.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {MOCK_BOOSTS.map((boost) => {
          const Icon = ICONS[boost.icon];
          return (
            <Card key={boost.id} className="flex flex-col p-5">
              <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg", ICON_BG[boost.icon])}>
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="mt-3 font-display text-base font-semibold text-ink-900">{boost.name}</h3>
              <p className="mt-1 flex-1 text-sm text-ink-400">{boost.description}</p>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="font-mono text-xl font-bold text-ink-900">{formatUSD(boost.priceUsd)}</span>
                <span className="text-xs text-ink-400">/ {boost.durationDays} days</span>
              </div>
              <Button className="mt-4 w-full" variant="brass" onClick={() => openCheckout(boost)}>
                Boost a listing
              </Button>
            </Card>
          );
        })}
      </div>

      <Dialog open={!!selectedBoost} onOpenChange={(open) => !open && setSelectedBoost(null)}>
        <DialogContent>
          <AnimatePresence mode="wait">
            {checkoutState === "select_listing" && (
              <motion.div key="select" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <DialogHeader>
                  <DialogTitle>{selectedBoost?.name}</DialogTitle>
                  <DialogDescription>
                    Choose which listing you'd like to boost for {selectedBoost?.durationDays} days.
                  </DialogDescription>
                </DialogHeader>

                <div className="mt-4 space-y-1.5">
                  <Label>Listing</Label>
                  <Select value={selectedListingId} onValueChange={setSelectedListingId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a listing" />
                    </SelectTrigger>
                    <SelectContent>
                      {MOCK_LISTINGS.slice(0, 4).map((l) => (
                        <SelectItem key={l.id} value={l.id}>
                          {l.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="mt-4 flex items-center justify-between rounded-lg bg-sand-100 px-4 py-3">
                  <span className="text-sm text-ink-600">Total due today</span>
                  <span className="font-mono text-lg font-bold text-ink-900">
                    {selectedBoost ? formatUSD(selectedBoost.priceUsd) : ""}
                  </span>
                </div>

                <DialogFooter className="mt-5">
                  <Button variant="outline" onClick={() => setSelectedBoost(null)}>
                    Cancel
                  </Button>
                  <Button disabled={!selectedListingId} onClick={confirmPurchase} className="gap-2">
                    <CreditCard className="h-4 w-4" /> Confirm & pay
                  </Button>
                </DialogFooter>
              </motion.div>
            )}

            {checkoutState === "processing" && (
              <motion.div
                key="processing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center py-10"
              >
                <Loader2 className="h-9 w-9 animate-spin text-clay-500" />
                <p className="mt-4 text-sm text-ink-600">Processing your payment...</p>
              </motion.div>
            )}

            {checkoutState === "success" && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center py-8 text-center"
              >
                <CheckCircle2 className="h-12 w-12 text-forest-500" />
                <h3 className="mt-3 font-display text-lg font-semibold text-ink-900">Boost active!</h3>
                <p className="mt-1 text-sm text-ink-400">
                  Your listing is now boosted for the next {selectedBoost?.durationDays} days.
                </p>
                <Badge variant="success" className="mt-3">
                  Active now
                </Badge>
                <Button className="mt-5" onClick={() => setSelectedBoost(null)}>
                  Done
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </DialogContent>
      </Dialog>
    </div>
  );
}
