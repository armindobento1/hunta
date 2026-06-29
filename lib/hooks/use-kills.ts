"use client";

import { useEffect, useState } from "react";

import type { Kill } from "@/lib/domain/kill";
import { subscribeToKills } from "@/lib/firebase/kill-repository";

import { useAuth } from "./use-auth";

export function useKills() {
  const { user } = useAuth();
  const [kills, setKills] = useState<Kill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    return subscribeToKills(
      user.uid,
      (nextKills) => {
        setKills(nextKills);
        setLoading(false);
      },
      () => {
        setError("Your portfolio could not be loaded. Check your connection.");
        setLoading(false);
      },
    );
  }, [user]);

  return { kills, loading, error };
}
