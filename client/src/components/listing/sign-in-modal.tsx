import { motion } from "framer-motion";
import { Chrome, Facebook, ShieldCheck, GraduationCap } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface SignInModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSignIn: (provider: "google" | "facebook") => void;
  context?: string;
}

export function SignInModal({ open, onOpenChange, onSignIn, context }: SignInModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <div className="mx-auto -mt-2 flex h-14 w-14 items-center justify-center rounded-2xl bg-forest-500 text-white shadow-card">
          <GraduationCap className="h-7 w-7" />
        </div>
        <DialogHeader className="text-center">
          <DialogTitle>Sign in to continue</DialogTitle>
          <DialogDescription>
            {context ?? "Create a free student account to contact verified landlords directly."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-2.5">
          <Button
            variant="outline"
            size="lg"
            className="justify-center gap-3"
            onClick={() => onSignIn("google")}
          >
            <Chrome className="h-4.5 w-4.5" /> Continue with Google
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="justify-center gap-3"
            onClick={() => onSignIn("facebook")}
          >
            <Facebook className="h-4.5 w-4.5 text-[#1877F2]" /> Continue with Facebook
          </Button>
        </div>

        <div className="flex items-center gap-2 rounded-lg bg-sand-100 px-3 py-2.5 text-xs text-ink-600">
          <ShieldCheck className="h-4 w-4 shrink-0 text-forest-600" />
          We only use this to verify you're a real student and protect landlords from spam inquiries.
        </div>

        <p className="text-center text-xs text-ink-400">
          By continuing you agree to House-By-Us's Terms of Service and Privacy Policy.
        </p>
      </DialogContent>
    </Dialog>
  );
}
