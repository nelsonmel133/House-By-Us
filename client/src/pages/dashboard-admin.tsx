import { useState } from "react";
import { Home, ShieldCheck } from "lucide-react";
import { AdminQueueList } from "@/components/dashboard/admin/admin-queue-list";
import { AdminDetailPane } from "@/components/dashboard/admin/admin-detail-pane";
import { AdminAnalyticsBreakdown } from "@/components/dashboard/admin/admin-analytics-breakdown";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/primitives";
import { MOCK_ADMIN_QUEUE } from "@/lib/mock-data";
import type { AdminQueueItem } from "@/types/domain";

export default function AdminDashboardPage() {
  const [queue, setQueue] = useState<AdminQueueItem[]>(MOCK_ADMIN_QUEUE);
  const [activeId, setActiveId] = useState<string | null>(MOCK_ADMIN_QUEUE[0]?.id ?? null);
  const [tab, setTab] = useState("queue");

  const activeItem = queue.find((q) => q.id === activeId) ?? null;

  function handleApprove(id: string) {
    // trpc.admin.approve.mutate({ listingId: queue.find(q => q.id === id)!.listing.id })
    console.log("approved", id);
  }

  function handleReject(id: string, reason: string) {
    // trpc.admin.reject.mutate({ listingId, reason })
    console.log("rejected", id, reason);
  }

  return (
    <div className="flex h-screen flex-col bg-sand-100">
      <header className="flex items-center justify-between border-b border-ink-900/8 bg-white px-4 py-3 md:px-6">
        <a href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-clay-500 text-white">
            <Home className="h-4 w-4" />
          </div>
          <span className="font-display text-lg font-bold tracking-tight text-ink-900">
            House<span className="text-clay-500">-By-Us</span>
            <span className="ml-2 rounded-full bg-ink-900 px-2 py-0.5 text-xs font-semibold text-white align-middle">
              Admin
            </span>
          </span>
        </a>
        <div className="flex items-center gap-4">
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList>
              <TabsTrigger value="queue">Review queue</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>
          </Tabs>
          <span className="hidden items-center gap-1.5 text-sm text-ink-400 md:flex">
            <ShieldCheck className="h-4 w-4 text-forest-600" /> {queue.length} pending
          </span>
        </div>
      </header>

      {tab === "queue" ? (
        <div className="flex flex-1 overflow-hidden">
          {/* Queue - left pane */}
          <div className="w-full max-w-sm shrink-0 overflow-y-auto scrollbar-thin border-r border-ink-900/8 bg-white">
            <div className="border-b border-ink-900/8 px-4 py-3">
              <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-ink-400">Review queue</h2>
            </div>
            <AdminQueueList items={queue} activeId={activeId} onSelect={setActiveId} />
          </div>

          {/* Detail - right pane */}
          <div className="flex-1 overflow-hidden bg-sand-100">
            <AdminDetailPane item={activeItem} onApprove={handleApprove} onReject={handleReject} />
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto scrollbar-thin p-6">
          <AdminAnalyticsBreakdown />
        </div>
      )}
    </div>
  );
}

