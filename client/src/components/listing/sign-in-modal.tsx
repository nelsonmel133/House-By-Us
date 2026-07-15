import { useState } from "react";
import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import { Chrome, ShieldCheck, GraduationCap, Loader2, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { auth, googleProvider, isFirebaseConfigured } from "@/lib/firebase";

interface SignInModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Fires once Firebase confirms a successful sign-in or sign-up. */
  onAuthenticated: () => void;
  context?: string;
}

/** Turns Firebase's `auth/xxx-yyy` error codes into short, human copy. */
function friendlyAuthError(code: string): string {
  switch (code) {
    case "auth/invalid-email":
      return "That email address doesn't look right.";
    case "auth/user-not-found":
      return "No account found with that email. Try creating one instead.";
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "Incorrect email or password.";
    case "auth/email-already-in-use":
      return "An account already exists with that email. Try signing in instead.";
    case "auth/weak-password":
      return "Password should be at least 6 characters.";
    case "auth/popup-closed-by-user":
      return "Sign-in was cancelled.";
    case "auth/network-request-failed":
      return "Network error — check your connection and try again.";
    default:
      return "Something went wrong signing you in. Please try again.";
  }
}

export function SignInModal({ open, onOpenChange, onAuthenticated, context }: SignInModalProps) {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loadingAction, setLoadingAction] = useState<"google" | "email" | null>(null);

  function resetLocalState() {
    setEmail("");
    setPassword("");
    setError(null);
    setMode("signin");
    setLoadingAction(null);
  }

  async function handleGoogleSignIn() {
    setError(null);
    setLoadingAction("google");
    try {
      await signInWithPopup(auth, googleProvider);
      resetLocalState();
      onAuthenticated();
    } catch (err) {
      const code = err instanceof Error && "code" in err ? (err as { code: string }).code : "";
      setError(friendlyAuthError(code));
    } finally {
      setLoadingAction(null);
    }
  }

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoadingAction("email");
    try {
      if (mode === "signin") {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
      resetLocalState();
      onAuthenticated();
    } catch (err) {
      const code = err instanceof Error && "code" in err ? (err as { code: string }).code : "";
      setError(friendlyAuthError(code));
    } finally {
      setLoadingAction(null);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) resetLocalState();
      }}
    >
      <DialogContent className="max-w-md">
        <div className="mx-auto -mt-2 flex h-14 w-14 items-center justify-center rounded-2xl bg-forest-500 text-white shadow-card">
          <GraduationCap className="h-7 w-7" />
        </div>
        <DialogHeader className="text-center">
          <DialogTitle>{mode === "signin" ? "Sign in to continue" : "Create your account"}</DialogTitle>
          <DialogDescription>
            {context ?? "Create a free student account to contact verified landlords directly."}
          </DialogDescription>
        </DialogHeader>

        {!isFirebaseConfigured && (
          <div className="flex items-start gap-2 rounded-lg bg-brass-300/20 px-3 py-2.5 text-xs text-ink-700">
            <AlertCircle className="h-4 w-4 shrink-0 text-brass-600" />
            Firebase isn't configured yet. Add your project's keys to a <code>.env</code> file (see
            <code className="mx-1">.env.example</code>) to enable sign-in.
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 rounded-lg bg-clay-50 px-3 py-2.5 text-xs font-medium text-clay-700">
            <AlertCircle className="h-4 w-4 shrink-0" /> {error}
          </div>
        )}

        <div className="grid gap-2.5">
          <Button
            variant="outline"
            size="lg"
            className="justify-center gap-3"
            disabled={loadingAction !== null}
            onClick={handleGoogleSignIn}
          >
            {loadingAction === "google" ? (
              <Loader2 className="h-4.5 w-4.5 animate-spin" />
            ) : (
              <Chrome className="h-4.5 w-4.5" />
            )}
            Continue with Google
          </Button>
        </div>

        <div className="flex items-center gap-3 text-xs text-ink-400">
          <div className="h-px flex-1 bg-ink-900/10" />
          or use your email
          <div className="h-px flex-1 bg-ink-900/10" />
        </div>

        <form onSubmit={handleEmailSubmit} className="grid gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor="signin-email">Email</Label>
            <Input
              id="signin-email"
              type="email"
              required
              autoComplete="email"
              placeholder="you@students.uz.ac.zw"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="signin-password">Password</Label>
            <Input
              id="signin-password"
              type="password"
              required
              minLength={6}
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <Button type="submit" size="lg" className="justify-center gap-2" disabled={loadingAction !== null}>
            {loadingAction === "email" && <Loader2 className="h-4.5 w-4.5 animate-spin" />}
            {mode === "signin" ? "Sign in" : "Create account"}
          </Button>
        </form>

        <p className="text-center text-xs text-ink-400">
          {mode === "signin" ? (
            <>
              Don't have an account?{" "}
              <button
                type="button"
                className="font-semibold text-clay-600 hover:underline"
                onClick={() => {
                  setMode("signup");
                  setError(null);
                }}
              >
                Create one
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button
                type="button"
                className="font-semibold text-clay-600 hover:underline"
                onClick={() => {
                  setMode("signin");
                  setError(null);
                }}
              >
                Sign in
              </button>
            </>
          )}
        </p>

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
