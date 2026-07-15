import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import { PersonRow } from "@/components/social/person-row";
import { subscribeToFollowers, subscribeToFollowingPeople, type FollowPerson } from "@/lib/firebase/follow-repository";
import { useBack } from "@/lib/hooks/use-back";
import { useViewerFollowing } from "@/lib/hooks/use-viewer-following";

export function FollowListPage({ kind }: { kind: "followers" | "following" }) {
  const { uid = "" } = useParams();
  const back = useBack(`/people/${uid}`);
  const viewer = useViewerFollowing();
  const [loaded, setLoaded] = useState<{ key: string; list: FollowPerson[] } | null>(null);
  const [failure, setFailure] = useState<{ key: string; message: string } | null>(null);
  const key = `${kind}:${uid}`;

  useEffect(() => {
    const subscribe = kind === "followers" ? subscribeToFollowers : subscribeToFollowingPeople;
    return subscribe(
      uid,
      (list) => {
        setLoaded({ key: `${kind}:${uid}`, list });
        setFailure(null);
      },
      (cause) => setFailure({ key: `${kind}:${uid}`, message: cause.message || "Could not load the list." }),
    );
  }, [uid, kind]);
  const list = loaded?.key === key ? loaded.list : null;
  const error = failure?.key === key ? failure.message : null;

  return (
    <main className="act-shell">
      <div className="cmt-head">
        <button type="button" className="cmt-back" aria-label="Back" onClick={back} />
        <span className="cmt-title">{kind === "followers" ? "Followers" : "Following"}</span>
        {list ? <span className="sheet-count">{list.length}</span> : null}
      </div>
      {error ? <p role="alert" style={{ padding: "0 16px" }}>{error}</p> : null}
      {viewer.error ? <p role="alert" style={{ padding: "0 16px" }}>{viewer.error}</p> : null}
      {!list ? (
        <p className="centered-state">Loading…</p>
      ) : (
        <ul className="follow-people" style={{ padding: "6px 16px" }}>
          {list.length === 0 ? (
            <li className="ppl-row">Nobody yet.</li>
          ) : (
            list.map((person) => (
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
