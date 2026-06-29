"use client";

import type { ReactNode } from "react";

import { AuthProvider } from "@/lib/hooks/use-auth";

export function AppProviders({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}
