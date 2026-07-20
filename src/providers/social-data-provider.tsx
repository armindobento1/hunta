import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

import type { PublicHunt } from "@/lib/domain/public-social";
import { likeHunt, unlikeHunt } from "@/lib/firebase/engagement-repository";
import { followAccount, subscribeToFollowing, unfollowAccount } from "@/lib/firebase/follow-repository";
import { getPublicProfile, subscribeToLikedHuntIds, subscribeToPublicHunts } from "@/lib/firebase/public-social-repository";
import { useAuth } from "@/lib/hooks/use-auth";

interface SocialState {
  hunts: PublicHunt[];
  followingIds: string[];
  likedIds: string[];
  loading: boolean;
  error: string | null;
  toggleFollow(id: string, isFollowing: boolean): Promise<void>;
  toggleLike(hunt: PublicHunt): Promise<void>;
}
const SocialContext = createContext<SocialState | null>(null);

export function SocialDataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [hunts, setHunts] = useState<PublicHunt[]>([]);
  const [followingIds, setFollowingIds] = useState<string[]>([]);
  const [likedIds, setLikedIds] = useState<string[]>([]);
  const [huntReady, setHuntReady] = useState(false);
  const [followReady, setFollowReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const actorPromiseRef = useRef<Promise<{ id: string; name: string }> | null>(null);

  useEffect(() => {
    if (!user) return;
    actorPromiseRef.current = getPublicProfile(user.uid)
      .then((profile) => ({ id: user.uid, name: profile?.displayName ?? user.displayName ?? "A hunter" }))
      .catch(() => ({ id: user.uid, name: user.displayName ?? "A hunter" }));
    const unsubscribeHunts = subscribeToPublicHunts((items) => { setHunts(items); setHuntReady(true); }, () => { setError("Public hunts could not be loaded."); setHuntReady(true); });
    const unsubscribeFollowing = subscribeToFollowing(user.uid, (ids) => { setFollowingIds(ids); setFollowReady(true); }, () => { setError("Following could not be loaded."); setFollowReady(true); });
    // One listener for the whole feed's like state — not one per card.
    const unsubscribeLiked = subscribeToLikedHuntIds(user.uid, setLikedIds, () => { setError("Your likes could not be loaded."); });
    return () => { unsubscribeHunts(); unsubscribeFollowing(); unsubscribeLiked(); };
  }, [user]);

  const value = useMemo<SocialState>(() => ({
    hunts,
    followingIds,
    likedIds,
    loading: !huntReady || !followReady,
    error,
    toggleFollow: async (id, isFollowing) => {
      if (!user) return;
      setError(null);
      setFollowingIds((current) => isFollowing
        ? current.filter((followedId) => followedId !== id)
        : current.includes(id) ? current : [...current, id]);
      try {
        if (isFollowing) await unfollowAccount(user.uid, id);
        else await followAccount(user.uid, id);
      } catch (cause) {
        setFollowingIds((current) => isFollowing
          ? current.includes(id) ? current : [...current, id]
          : current.filter((followedId) => followedId !== id));
        setError(cause instanceof Error ? cause.message : "Could not update the follow.");
      }
    },
    toggleLike: async (hunt) => {
      if (!user) return;
      setError(null);
      const liked = likedIds.includes(hunt.id);
      // Optimistic: flip the like immediately; the count follows from the hunt
      // doc's own listener (likeCount is denormalized on it). Revert on failure.
      setLikedIds((prev) => (liked ? prev.filter((id) => id !== hunt.id) : [...prev, hunt.id]));
      try {
        if (liked) await unlikeHunt(hunt, user.uid);
        else {
          const actor = await (actorPromiseRef.current
            ?? Promise.resolve({ id: user.uid, name: user.displayName ?? "A hunter" }));
          await likeHunt(hunt, actor);
        }
      } catch (cause) {
        setLikedIds((prev) => (liked ? [...prev, hunt.id] : prev.filter((id) => id !== hunt.id)));
        setError(cause instanceof Error ? cause.message : "Could not update the like.");
      }
    },
  }), [error, followReady, followingIds, huntReady, hunts, likedIds, user]);

  return <SocialContext.Provider value={value}>{children}</SocialContext.Provider>;
}

export function useSocialData() {
  const value = useContext(SocialContext);
  if (!value) throw new Error("Social data hooks must be used within SocialDataProvider.");
  return value;
}
