/**
 * Firebase initialization.
 *
 * All values come from Vite env vars (see `.env.example`). Create a Firebase
 * project at https://console.firebase.google.com, register a Web App, enable
 * the "Google" and "Email/Password" sign-in providers under
 * Authentication → Sign-in method, and paste the generated config values
 * into your local `.env` file (never commit real keys).
 */
import { initializeApp, getApps, type FirebaseOptions } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig: FirebaseOptions = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Guard against re-initializing during Vite HMR.
export const firebaseApp = getApps().length ? getApps()[0]! : initializeApp(firebaseConfig);

export const auth = getAuth(firebaseApp);
export const googleProvider = new GoogleAuthProvider();

/**
 * True once real Firebase config has been supplied. Lets the UI show a
 * helpful setup message instead of a cryptic Firebase error when someone
 * runs the app before creating `.env`.
 */
export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.authDomain && firebaseConfig.projectId
);
