import { useEffect } from "react";
import { useLocation } from "wouter";
import { Loader2, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth, ADMIN_EMAIL } from "@/lib/auth-context";

/**
 * Gates access to the admin dashboard. Only the account signed in with
 * ADMIN_EMAIL is allowed through:
 *   - Not signed in yet  → prompts sign-in, then re-checks.
 *   - Signed in, wrong account → shown an "access denied" screen.
 *   - Signed in as admin → renders the page.
 */
export function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, isAdmin, requireAuth } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      requireAuth(() => {}, "Sign in with the admin account to review listings.");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, user]);

  if (loading) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-2 bg-sand-100">
        <Loader2 className="h-6 w-6 animate-spin text-ink-400" />
      </div>
    );
  }

  if (user && !isAdmin) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-3 bg-sand-100 px-6 text-center">
        <ShieldAlert className="h-10 w-10 text-clay-500" />
        <h1 className="font-display text-2xl font-bold text-ink-900">Access denied</h1>
        <p className="max-w-sm text-sm text-ink-400">
          The admin dashboard is only available to <span className="font-medium text-ink-600">{ADMIN_EMAIL}</span>.
          You're signed in as {user.email}.
        </p>
        <Button className="mt-2" onClick={() => navigate("/")}>
          Back to search
        </Button>
      </div>
    );
  }

  if (!user) {
    // Sign-in modal is open (triggered above); nothing to render yet.
    return <div className="h-screen bg-sand-100" />;
  }

  return <>{children}</>;
}
