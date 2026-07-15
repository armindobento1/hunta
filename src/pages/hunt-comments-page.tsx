import { useEffect, useState } from "react";
import { Navigate, useParams } from "react-router-dom";

import { HuntComments } from "@/components/social/hunt-engagement";
import type { PublicHunt } from "@/lib/domain/public-social";
import { getPublicHunt } from "@/lib/firebase/public-social-repository";

export function HuntCommentsPage() {
  const { uid = "", publicHuntId = "" } = useParams();
  const [hunt, setHunt] = useState<PublicHunt | null>();
  const [failure, setFailure] = useState(false);
  useEffect(() => {
    getPublicHunt(publicHuntId).then((value) => {
      setHunt(value);
      setFailure(false);
    }).catch(() => setFailure(true));
  }, [publicHuntId]);
  if (failure) return <main className="centered-state" role="alert">Could not load this hunt. Check your connection and try again.</main>;
  if (hunt === undefined) return <main className="centered-state">Loading comments…</main>;
  if (!hunt) return <main className="centered-state">Public hunt not found.</main>;
  if (hunt.ownerId !== uid) return <Navigate replace to={`/people/${hunt.ownerId}/hunts/${hunt.id}/comments`} />;
  return <HuntComments hunt={hunt} />;
}
