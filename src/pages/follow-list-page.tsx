import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { listFollowers, listFollowing, type FollowPerson } from "@/lib/firebase/follow-repository";
import { useViewerFollowing } from "@/lib/hooks/use-viewer-following";
import { initials } from "@/lib/ui/initials";

export function FollowListPage({ kind }: { kind: "followers" | "following" }) {
  const { uid = "" } = useParams();
  const navigate = useNavigate();
  const viewer = useViewerFollowing();
  const [loaded, setLoaded] = useState<{ key: string; list: FollowPerson[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const key = `${kind}:${uid}`;

  useEffect(() => {
    let cancelled = false;
    (kind === "followers" ? listFollowers(uid) : listFollowing(uid))
      .then((value) => { if (!cancelled) setLoaded({ key: `${kind}:${uid}`, list: value }); })
      .catch((cause: unknown) => { if (!cancelled) setError(cause instanceof Error ? cause.message : "Could not load the list."); });
    return () => { cancelled = true; };
  }, [uid, kind]);
  const list = loaded?.key === key ? loaded.list : null;

  return (
    <main className="act-shell">
      <div className="cmt-head">
        <button type="button" className="cmt-back" aria-label="Back" onClick={() => navigate(-1)} />
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
              <li className="ppl-row" key={person.id}>
                <span className="ppl-avatar" aria-hidden="true">
                  {person.avatarUrl ? <img src={person.avatarUrl} alt="" /> : initials(person.displayName)}
                </span>
                <Link className="ppl-name" to={`/people/${person.id}`}>{person.displayName}</Link>
                {viewer.viewerId && viewer.viewerId !== person.id && viewer.followingIds ? (
                  <button
                    type="button"
                    className={`ppl-btn${viewer.followingIds.includes(person.id) ? " ppl-btn-following" : ""}`}
                    onClick={() => void viewer.toggle(person.id)}
                  >
                    {viewer.followingIds.includes(person.id) ? "Following" : "Follow"}
                  </button>
                ) : null}
              </li>
            ))
          )}
        </ul>
      )}
    </main>
  );
}
