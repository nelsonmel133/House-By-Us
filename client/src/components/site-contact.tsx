import { Phone, Headset } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";

/**
 * Platform owner / support contacts. Shown to students and landlords who
 * need to reach House-By-Us directly (e.g. disputes, account issues, or
 * anything the in-app messaging can't resolve).
 */
export const PLATFORM_CONTACTS = [
  { name: "Vimbai Tipedze", phone: "0774 497 837" },
  { name: "Makhosi Mathe", phone: "0781 482 977" },
] as const;

function ContactList() {
  return (
    <>
      {PLATFORM_CONTACTS.map((c) => (
        <a
          key={c.name}
          href={`tel:${c.phone.replace(/\s/g, "")}`}
          className="flex items-center justify-between gap-3 rounded-lg border border-ink-900/8 px-3 py-2.5 hover:bg-sand-100"
        >
          <div>
            <p className="text-sm font-semibold text-ink-900">{c.name}</p>
            <p className="text-xs text-ink-400">Platform support</p>
          </div>
          <span className="flex items-center gap-1.5 text-sm font-medium text-clay-600">
            <Phone className="h-3.5 w-3.5" /> {c.phone}
          </span>
        </a>
      ))}
    </>
  );
}

/** Small "Contact us" trigger for use in headers of full-height (h-screen) app pages. */
export function ContactPopoverButton() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1.5">
          <Headset className="h-3.5 w-3.5" /> Contact us
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72" align="end">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-400">
          Need help? Reach the House-By-Us team
        </p>
        <div className="space-y-2">
          <ContactList />
        </div>
      </PopoverContent>
    </Popover>
  );
}

/** Static footer block for use on normal-flow (min-h-screen) pages. */
export function SiteFooterContact() {
  return (
    <footer className="mx-auto mt-10 max-w-6xl px-4 pb-8 md:px-6">
      <div className="rounded-xl border border-ink-900/8 bg-white p-5 shadow-card">
        <p className="mb-3 text-sm font-semibold text-ink-900">Need help? Reach the House-By-Us team</p>
        <div className="grid gap-2.5 sm:grid-cols-2">
          <ContactList />
        </div>
      </div>
    </footer>
  );
}
