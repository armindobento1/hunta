"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";

import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/lib/hooks/use-auth";

export function AuthGuard({ children }: { children: ReactNode }) {
  const { user, loading, error } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user && !error) {
      router.replace("/auth");
    }
  }, [error, loading, router, user]);

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

  return user ? children : null;
}
