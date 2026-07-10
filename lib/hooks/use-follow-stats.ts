import { useEffect, useState } from "react";

import { getFollowCounts, listFollowers, listFollowing, type FollowPerson } from "@/lib/firebase/follow-repository";

export function useFollowStats(uid: string) {
  const [counts, setCounts] = useState<{ followers: number; following: number } | null>(null);
  const [people, setPeople] = useState<{ kind: "followers" | "following"; list: FollowPerson[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    getFollowCounts(uid)
      .then((value) => { if (!cancelled) setCounts(value); })
      .catch((cause: unknown) => { if (!cancelled) setError(cause instanceof Error ? cause.message : "Could not load follow counts."); });
    return () => { cancelled = true; };
  }, [uid]);
  async function toggleList(kind: "followers" | "following") {
    if (people?.kind === kind) { setPeople(null); return; }
    try {
      setPeople({ kind, list: kind === "followers" ? await listFollowers(uid) : await listFollowing(uid) });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load the list.");
    }
  }
  return { counts, people, error, toggleList };
}
