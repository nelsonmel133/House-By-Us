import { useState } from "react";
import { motion } from "framer-motion";
import { Home, Plus, X, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/primitives";
import { MetricCardsRow } from "@/components/dashboard/landlord/metric-cards";
import { LeadsInbox } from "@/components/dashboard/landlord/leads-inbox";
import { MonetizationPanel } from "@/components/dashboard/landlord/monetization-panel";
import { ListingCreationWizard } from "@/components/dashboard/landlord/listing-form/listing-creation-wizard";
import { MOCK_LANDLORD_METRICS, MOCK_LEADS } from "@/lib/mock-data";

export default function LandlordDashboardPage() {
  const [showWizard, setShowWizard] = useState(false);

  return (
    <div className="min-h-screen bg-sand-100">
      <header className="border-b border-ink-900/8 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5 md:px-6">
          <a href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-clay-500 text-white">
              <Home className="h-4 w-4" />
            </div>
            <span className="font-display text-lg font-bold tracking-tight text-ink-900">
              House<span className="text-clay-500">-By-Us</span>
              <span className="ml-2 rounded-full bg-forest-50 px-2 py-0.5 text-xs font-semibold text-forest-600 align-middle">
                Landlord
              </span>
            </span>
          </a>
          <Button onClick={() => setShowWizard((s) => !s)} className="gap-1.5">
            {showWizard ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {showWizard ? "Close" : "New listing"}
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-8 px-4 py-7 md:px-6">
        {showWizard ? (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="mb-4 font-display text-2xl font-bold text-ink-900">List a new property</h1>
            <ListingCreationWizard onComplete={() => setShowWizard(false)} />
          </motion.div>
        ) : (
          <>
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              <h1 className="font-display text-2xl font-bold text-ink-900">Welcome back, Mrs. Chikuni</h1>
              <p className="mt-1 text-sm text-ink-400">Here's how your listings are performing this month.</p>
            </motion.div>

            <MetricCardsRow metrics={MOCK_LANDLORD_METRICS} />

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <Card className="lg:col-span-2">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Inbox className="h-4.5 w-4.5 text-clay-500" /> Recent leads
                  </CardTitle>
                  <span className="text-xs font-medium text-ink-400">{MOCK_LEADS.length} total</span>
                </CardHeader>
                <div className="px-5 pb-2">
                  <LeadsInbox leads={MOCK_LEADS} />
                </div>
              </Card>

              <Card className="p-5">
                <h3 className="font-display text-base font-semibold text-ink-900">Verification status</h3>
                <p className="mt-1 text-sm text-ink-400">
                  Verified landlords get up to 3x more leads. Keep your documents current to maintain your badge.
                </p>
                <div className="mt-4 space-y-2.5">
                  <div className="flex items-center justify-between rounded-lg bg-forest-50 px-3 py-2.5 text-sm">
                    <span className="text-forest-700 font-medium">National ID</span>
                    <span className="text-forest-600">Verified</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-forest-50 px-3 py-2.5 text-sm">
                    <span className="text-forest-700 font-medium">Proof of ownership</span>
                    <span className="text-forest-600">Verified</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-brass-300/20 px-3 py-2.5 text-sm">
                    <span className="font-medium text-brass-700">Electrical safety cert</span>
                    <span className="text-brass-600">Expires in 12 days</span>
                  </div>
                </div>
              </Card>
            </div>

            <MonetizationPanel />
          </>
        )}
      </main>
    </div>
  );
}
