import { useEffect, useState } from "react";

import { followAccount, subscribeToFollowing, unfollowAccount } from "@/lib/firebase/follow-repository";
import { useAuth } from "@/lib/hooks/use-auth";

/** The signed-in viewer's follow graph plus a toggle, for follow buttons anywhere. */
export function useViewerFollowing() {
  const { user } = useAuth();
  const [followingIds, setFollowingIds] = useState<string[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (!user) return;
    return subscribeToFollowing(user.uid, setFollowingIds, () => setFollowingIds(null));
  }, [user]);
  async function toggle(id: string) {
    if (!user || !followingIds) return;
    try {
      if (followingIds.includes(id)) await unfollowAccount(user.uid, id);
      else await followAccount(user.uid, id);
      setError(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not update follow.");
    }
  }
  return { viewerId: user?.uid ?? null, followingIds, toggle, error };
}
