import { useEffect, useState } from "react";

import type { HuntComment, HuntLike } from "@/lib/domain/engagement";
import type { PublicHunt } from "@/lib/domain/public-social";
import { addHuntComment, deleteHuntComment, likeHunt, subscribeToHuntComments, subscribeToHuntLikes, unlikeHunt } from "@/lib/firebase/engagement-repository";
import { getPublicProfile } from "@/lib/firebase/public-social-repository";
import { useAuth } from "@/lib/hooks/use-auth";

async function actorFor(uid: string) {
  const profile = await getPublicProfile(uid);
  return { id: uid, name: profile?.displayName ?? "A hunter" };
}

export function useHuntEngagement(hunt: PublicHunt) {
  const { user } = useAuth();
  const [likes, setLikes] = useState<HuntLike[]>([]);
  const [comments, setComments] = useState<HuntComment[]>([]);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    const unsubscribeLikes = subscribeToHuntLikes(hunt.id, setLikes, (cause) => setError(cause.message));
    const unsubscribeComments = subscribeToHuntComments(hunt.id, setComments, (cause) => setError(cause.message));
    return () => { unsubscribeLikes(); unsubscribeComments(); };
  }, [hunt.id]);
  const viewerId = user?.uid ?? null;
  const likedByMe = Boolean(viewerId && likes.some((like) => like.likerId === viewerId));
  return {
    likes, comments, likedByMe, viewerId, error,
    async toggleLike() {
      if (!viewerId) return;
      try {
        if (likedByMe) await unlikeHunt(hunt, viewerId);
        else await likeHunt(hunt, await actorFor(viewerId));
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Could not update like.");
      }
    },
    async addComment(body: string): Promise<boolean> {
      if (!viewerId) return false;
      try {
        await addHuntComment(hunt, await actorFor(viewerId), body);
        return true;
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Could not post comment.");
        return false;
      }
    },
    async removeComment(comment: HuntComment) {
      try {
        await deleteHuntComment(hunt, comment);
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Could not delete comment.");
      }
    },
  };
}
