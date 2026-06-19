import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Phone, MessageSquare, ShieldCheck, Send, CheckCircle2, Star, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback, Separator, Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/primitives";
import { Label } from "@/components/ui/label";
import { SignInModal } from "./sign-in-modal";
import type { LandlordSummary } from "@/types/domain";
import { initials, formatUSD } from "@/lib/utils";

const messageSchema = z.object({
  message: z.string().min(10, "Please write at least 10 characters so the landlord has context."),
});
type MessageForm = z.infer<typeof messageSchema>;

const callbackSchema = z.object({
  phone: z.string().min(9, "Enter a valid phone number, e.g. 077XXXXXXX"),
  preferredTime: z.string().min(1, "Pick a preferred time"),
});
type CallbackForm = z.infer<typeof callbackSchema>;

interface ContactLandlordWidgetProps {
  landlord: LandlordSummary;
  listingTitle: string;
  pricePerMonthUsd: number;
  /** In production this is derived from trpc.auth.session.useQuery(). */
  isAuthenticated: boolean;
}

export function ContactLandlordWidget({
  landlord,
  listingTitle,
  pricePerMonthUsd,
  isAuthenticated: initialAuth,
}: ContactLandlordWidgetProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(initialAuth);
  const [signInOpen, setSignInOpen] = useState(false);
  const [submitted, setSubmitted] = useState<"message" | "callback" | null>(null);
  const [pendingAction, setPendingAction] = useState<"message" | "callback" | null>(null);

  const messageForm = useForm<MessageForm>({
    resolver: zodResolver(messageSchema),
    defaultValues: { message: `Hi, I'm interested in "${listingTitle}". Is it still available?` },
  });

  const callbackForm = useForm<CallbackForm>({
    resolver: zodResolver(callbackSchema),
    defaultValues: { phone: "", preferredTime: "" },
  });

  function requireAuth(action: "message" | "callback") {
    if (!isAuthenticated) {
      setPendingAction(action);
      setSignInOpen(true);
      return false;
    }
    return true;
  }

  function handleSignIn(_provider: "google" | "facebook") {
    // trpc.auth.oauthSignIn.mutate({ provider }) -> redirect, then session set on return.
    setIsAuthenticated(true);
    setSignInOpen(false);
  }

  function onSubmitMessage(data: MessageForm) {
    if (!requireAuth("message")) return;
    // trpc.leads.create.mutate({ listingId, message: data.message, channel: "message" })
    console.log("message submitted", data);
    setSubmitted("message");
  }

  function onSubmitCallback(data: CallbackForm) {
    if (!requireAuth("callback")) return;
    // trpc.leads.create.mutate({ listingId, message: `Call ${data.phone} at ${data.preferredTime}`, channel: "callback" })
    console.log("callback requested", data);
    setSubmitted("callback");
  }

  return (
    <div className="sticky top-6 overflow-hidden rounded-xl border border-ink-900/8 bg-white shadow-panel">
      <div className="border-b border-ink-900/8 p-5">
        <div className="flex items-baseline justify-between">
          <span className="font-mono text-2xl font-bold text-ink-900">{formatUSD(pricePerMonthUsd)}</span>
          <span className="text-sm text-ink-400">/month</span>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <Avatar className="h-11 w-11">
            <AvatarImage src={landlord.avatarUrl} alt={landlord.name} />
            <AvatarFallback>{initials(landlord.name)}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-semibold text-ink-900">{landlord.name}</p>
              {landlord.isVerified && <ShieldCheck className="h-3.5 w-3.5 text-forest-600" />}
            </div>
            <p className="flex items-center gap-1 text-xs text-ink-400">
              <Clock className="h-3 w-3" /> Responds {landlord.responseRateApprox}% of the time
            </p>
          </div>
        </div>
      </div>

      <div className="p-5">
        <AnimatePresence mode="wait">
          {submitted ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center py-4 text-center"
            >
              <CheckCircle2 className="h-10 w-10 text-forest-500" />
              <p className="mt-3 font-display text-base font-semibold text-ink-900">
                {submitted === "message" ? "Message sent!" : "Callback requested!"}
              </p>
              <p className="mt-1 text-sm text-ink-400">
                {landlord.name.split(" ")[0]} typically responds within a few hours.
              </p>
              <Button variant="outline" size="sm" className="mt-4" onClick={() => setSubmitted(null)}>
                Send another message
              </Button>
            </motion.div>
          ) : (
            <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Tabs defaultValue="message">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="message" className="gap-1.5">
                    <MessageSquare className="h-3.5 w-3.5" /> Message
                  </TabsTrigger>
                  <TabsTrigger value="callback" className="gap-1.5">
                    <Phone className="h-3.5 w-3.5" /> Callback
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="message">
                  <form onSubmit={messageForm.handleSubmit(onSubmitMessage)} className="space-y-3 pt-1">
                    <textarea
                      {...messageForm.register("message")}
                      rows={4}
                      className="w-full rounded-md border border-ink-900/15 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-clay-500"
                      placeholder="Introduce yourself and ask your question..."
                    />
                    {messageForm.formState.errors.message && (
                      <p className="text-xs text-destructive">{messageForm.formState.errors.message.message}</p>
                    )}
                    <Button type="submit" className="w-full gap-2" size="lg">
                      <Send className="h-4 w-4" /> Send message
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="callback">
                  <form onSubmit={callbackForm.handleSubmit(onSubmitCallback)} className="space-y-3 pt-1">
                    <div className="space-y-1.5">
                      <Label htmlFor="phone">Your phone number</Label>
                      <input
                        id="phone"
                        {...callbackForm.register("phone")}
                        placeholder="077X XXX XXX"
                        className="w-full rounded-md border border-ink-900/15 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-clay-500"
                      />
                      {callbackForm.formState.errors.phone && (
                        <p className="text-xs text-destructive">{callbackForm.formState.errors.phone.message}</p>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="preferredTime">Preferred callback time</Label>
                      <input
                        id="preferredTime"
                        {...callbackForm.register("preferredTime")}
                        placeholder="e.g. Today after 4pm"
                        className="w-full rounded-md border border-ink-900/15 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-clay-500"
                      />
                      {callbackForm.formState.errors.preferredTime && (
                        <p className="text-xs text-destructive">{callbackForm.formState.errors.preferredTime.message}</p>
                      )}
                    </div>
                    <Button type="submit" className="w-full gap-2" size="lg" variant="secondary">
                      <Phone className="h-4 w-4" /> Request callback
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>

              {!isAuthenticated && (
                <p className="mt-3 text-center text-xs text-ink-400">
                  You'll be asked to sign in before this is sent.
                </p>
              )}

              {isAuthenticated && landlord.phoneVisible && (
                <>
                  <Separator className="my-4" />
                  <Button variant="outline" className="w-full gap-2">
                    <Phone className="h-4 w-4" /> Show phone number
                  </Button>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <SignInModal
        open={signInOpen}
        onOpenChange={setSignInOpen}
        onSignIn={handleSignIn}
        context={
          pendingAction === "callback"
            ? "Sign in to request a callback from this landlord."
            : "Sign in to message this landlord directly."
        }
      />
    </div>
  );
}
