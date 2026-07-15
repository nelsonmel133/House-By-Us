import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  onAuthStateChanged,
  signOut as firebaseSignOut,
  type User as FirebaseUser,
} from "firebase/auth";
import { auth } from "./firebase";
import { SignInModal } from "@/components/listing/sign-in-modal";

/**
 * The single admin account for House-By-Us. Whoever signs in with this email
 * (Google or email/password) is granted the admin role and can access the
 * listing-approval dashboard at /dashboard/admin.
 *
 * In a real deployment you'd manage this via custom claims / a `role` column
 * in your users table rather than a hardcoded email — this matches how the
 * backend's `adminProcedure` already expects a `role: "admin"` on the user
 * (see backend/server/src/middleware/trpc.ts). Swap this constant out for
 * that check once the client talks to the real API.
 */
export const ADMIN_EMAIL = "vimbaidhoro@gmail.com";

export type UserRole = "admin" | "landlord" | "user";

export interface AuthUser {
  uid: string;
  name: string;
  email: string;
  photoUrl?: string;
  role: UserRole;
}

interface AuthContextValue {
  isAuthenticated: boolean;
  isAdmin: boolean;
  user: AuthUser | null;
  /** True while Firebase resolves the initial auth state on page load. */
  loading: boolean;
  /**
   * Opens the sign-in modal. If the person completes sign-in, `onSuccess` runs
   * (e.g. to redirect them to the page they were trying to reach).
   * If they're already signed in, `onSuccess` runs immediately and no modal appears.
   */
  requireAuth: (onSuccess: () => void, context?: string) => void;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function mapFirebaseUser(fbUser: FirebaseUser): AuthUser {
  const email = fbUser.email ?? "";
  const role: UserRole = email.toLowerCase() === ADMIN_EMAIL ? "admin" : "user";
  return {
    uid: fbUser.uid,
    name: fbUser.displayName || email.split("@")[0] || "Student",
    email,
    photoUrl: fbUser.photoURL ?? undefined,
    role,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalContext, setModalContext] = useState<string | undefined>(undefined);
  const [pendingSuccess, setPendingSuccess] = useState<(() => void) | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (fbUser) => {
      setUser(fbUser ? mapFirebaseUser(fbUser) : null);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

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

  function handleAuthenticated() {
    setModalOpen(false);
    pendingSuccess?.();
    setPendingSuccess(null);
  }

  async function signOut() {
    await firebaseSignOut(auth);
  }

  const value = useMemo<AuthContextValue>(
    () => ({
      isAuthenticated: !!user,
      isAdmin: user?.role === "admin",
      user,
      loading,
      requireAuth,
      signOut,
    }),
    [user, loading, requireAuth]
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
        onAuthenticated={handleAuthenticated}
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
