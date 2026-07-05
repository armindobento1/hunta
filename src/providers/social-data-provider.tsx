import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import type { PublicHunt } from "@/lib/domain/public-social";
import { followAccount, subscribeToFollowing, unfollowAccount } from "@/lib/firebase/follow-repository";
import { subscribeToPublicHunts } from "@/lib/firebase/public-social-repository";
import { useAuth } from "@/lib/hooks/use-auth";

interface SocialState { hunts: PublicHunt[]; followingIds: string[]; loading: boolean; error: string | null; toggleFollow(id: string, isFollowing: boolean): Promise<void> }
const SocialContext = createContext<SocialState | null>(null);

export function SocialDataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [hunts, setHunts] = useState<PublicHunt[]>([]); const [followingIds, setFollowingIds] = useState<string[]>([]);
  const [huntReady, setHuntReady] = useState(false); const [followReady, setFollowReady] = useState(false); const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (!user) return;
    const unsubscribeHunts = subscribeToPublicHunts((items) => { setHunts(items); setHuntReady(true); }, () => { setError("Public hunts could not be loaded."); setHuntReady(true); });
    const unsubscribeFollowing = subscribeToFollowing(user.uid, (ids) => { setFollowingIds(ids); setFollowReady(true); }, () => { setError("Following could not be loaded."); setFollowReady(true); });
    return () => { unsubscribeHunts(); unsubscribeFollowing(); };
  }, [user]);
  const value = useMemo<SocialState>(() => ({ hunts, followingIds, loading: !huntReady || !followReady, error, toggleFollow: async (id, isFollowing) => { if (!user) return; if (isFollowing) await unfollowAccount(user.uid, id); else await followAccount(user.uid, id); } }), [error, followReady, followingIds, huntReady, hunts, user]);
  return <SocialContext.Provider value={value}>{children}</SocialContext.Provider>;
}

export function useSocialData() { const value = useContext(SocialContext); if (!value) throw new Error("Social data hooks must be used within SocialDataProvider."); return value; }
