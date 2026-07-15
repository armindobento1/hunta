import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import { PersonRow } from "@/components/social/person-row";
import { subscribeToHuntLikes } from "@/lib/firebase/engagement-repository";
import { resolvePeople, type FollowPerson } from "@/lib/firebase/follow-repository";
import { useBack } from "@/lib/hooks/use-back";
import { useViewerFollowing } from "@/lib/hooks/use-viewer-following";

export function HuntLikersPage() {
  const { uid = "", publicHuntId = "" } = useParams();
  const back = useBack(`/people/${uid}/hunts/${publicHuntId}`);
  const viewer = useViewerFollowing();
  const [loaded, setLoaded] = useState<{ huntId: string; people: FollowPerson[] } | null>(null);
  const [failure, setFailure] = useState<{ huntId: string; message: string } | null>(null);

  useEffect(() => {
    const cache = new Map<string, FollowPerson>();
    let active = true;
    let emission = 0;
    const unsubscribe = subscribeToHuntLikes(publicHuntId, (likes) => {
      const current = ++emission;
      void resolvePeople(likes.map((like) => like.likerId), cache)
        .then((resolved) => {
          if (active && current === emission) {
            setLoaded({ huntId: publicHuntId, people: resolved });
            setFailure(null);
          }
        })
        .catch((cause: unknown) => {
          if (active) setFailure({ huntId: publicHuntId, message: cause instanceof Error ? cause.message : "Could not load likes." });
        });
    }, (cause) => {
      if (active) setFailure({ huntId: publicHuntId, message: cause.message || "Could not load likes." });
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, [publicHuntId]);
  const people = loaded?.huntId === publicHuntId ? loaded.people : null;
  const error = failure?.huntId === publicHuntId ? failure.message : null;

  return (
    <main className="act-shell">
      <div className="cmt-head">
        <button type="button" className="cmt-back" aria-label="Back" onClick={back} />
        <span className="cmt-title">Likes</span>
        {people ? <span className="sheet-count">{people.length}</span> : null}
      </div>
      {error ? <p role="alert" style={{ padding: "0 16px" }}>{error}</p> : null}
      {viewer.error ? <p role="alert" style={{ padding: "0 16px" }}>{viewer.error}</p> : null}
      {!people ? (
        <p className="centered-state">Loading…</p>
      ) : (
        <ul className="follow-people" style={{ padding: "6px 16px" }}>
          {people.length === 0 ? (
            <li className="ppl-row">Nobody yet.</li>
          ) : (
            people.map((person) => (
              <PersonRow
                key={person.id}
                person={person}
                viewerId={viewer.viewerId}
                followingIds={viewer.followingIds}
                onToggle={(id) => void viewer.toggle(id)}
              />
            ))
          )}
        </ul>
      )}
    </main>
  );
}
