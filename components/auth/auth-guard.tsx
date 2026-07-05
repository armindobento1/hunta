import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";

import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/lib/hooks/use-auth";

export function AuthGuard({ children }: { children: ReactNode }) {
  const { user, loading, error } = useAuth();

  if (loading) {
    return (
      <main className="centered-state">
        <Spinner label="Checking your session" />
      </main>
    );
  }

  if (error) {
    return (
      <main className="centered-state">
        <p role="alert">{error}</p>
      </main>
    );
  }

  return user ? children : <Navigate replace to="/auth" />;
}
