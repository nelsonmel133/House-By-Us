import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { SignInModal } from "@/components/listing/sign-in-modal";

export interface AuthUser {
  name: string;
  provider: "google" | "facebook";
}

interface AuthContextValue {
  isAuthenticated: boolean;
  user: AuthUser | null;
  /**
   * Opens the sign-in modal. If the person completes sign-in, `onSuccess` runs
   * (e.g. to redirect them to the page they were trying to reach).
   * If they're already signed in, `onSuccess` runs immediately and no modal appears.
   */
  requireAuth: (onSuccess: () => void, context?: string) => void;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalContext, setModalContext] = useState<string | undefined>(undefined);
  const [pendingSuccess, setPendingSuccess] = useState<(() => void) | null>(null);

  const requireAuth = useCallback(
    (onSuccess: () => void, context?: string) => {
      if (user) {
        onSuccess();
        return;
      }
      setModalContext(context);
      setPendingSuccess(() => onSuccess);
      setModalOpen(true);
    },
    [user]
  );

  function handleSignIn(provider: "google" | "facebook") {
    // In production: trpc.auth.oauthSignIn.mutate({ provider }) -> redirect, then session set on return.
    setUser({ name: provider === "google" ? "Tinashe M." : "Tinashe M.", provider });
    setModalOpen(false);
    pendingSuccess?.();
    setPendingSuccess(null);
  }

  function signOut() {
    // In production: trpc.auth.signOut.mutate()
    setUser(null);
  }

  const value = useMemo<AuthContextValue>(
    () => ({ isAuthenticated: !!user, user, requireAuth, signOut }),
    [user, requireAuth]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
      <SignInModal
        open={modalOpen}
        onOpenChange={(open) => {
          setModalOpen(open);
          if (!open) setPendingSuccess(null);
        }}
        onSignIn={handleSignIn}
        context={modalContext}
      />
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
