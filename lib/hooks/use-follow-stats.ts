import { useCallback, useEffect, useRef, useState } from "react";

import { getFollowCounts } from "@/lib/firebase/follow-repository";

export function useFollowStats(uid: string) {
  const [counts, setCounts] = useState<{ followers: number; following: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const request = useRef(0);
  const refresh = useCallback(async () => {
    const current = ++request.current;
    try {
      const value = await getFollowCounts(uid);
      if (current === request.current) {
        setCounts(value);
        setError(null);
      }
    } catch (cause) {
      if (current === request.current) {
        setError(cause instanceof Error ? cause.message : "Could not load follow counts.");
      }
    }
  }, [uid]);

  useEffect(() => {
    const current = ++request.current;
    getFollowCounts(uid)
      .then((value) => {
        if (current === request.current) {
          setCounts(value);
          setError(null);
        }
      })
      .catch((cause: unknown) => {
        if (current === request.current) {
          setError(cause instanceof Error ? cause.message : "Could not load follow counts.");
        }
      });
    return () => { request.current += 1; };
  }, [uid]);

  return { counts, error, refresh };
}
