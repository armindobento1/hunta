"use client";

import { onAuthStateChanged, type User } from "firebase/auth";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  getFirebaseServices,
  isFirebaseConfigured,
} from "@/lib/firebase/config";

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const configured = isFirebaseConfigured();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(configured);
  const [error, setError] = useState<string | null>(
    configured ? null : "Firebase is not configured for this environment.",
  );

  useEffect(() => {
    if (!configured) return;

    return onAuthStateChanged(
      getFirebaseServices().auth,
      (nextUser) => {
        setUser(nextUser);
        setLoading(false);
      },
      () => {
        setError("We could not verify your session. Please reload and try again.");
        setLoading(false);
      },
    );
  }, [configured]);

  const value = useMemo(() => ({ user, loading, error }), [user, loading, error]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return value;
}
