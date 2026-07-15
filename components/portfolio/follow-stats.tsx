import { Link } from "react-router-dom";

import { useFollowStats } from "@/lib/hooks/use-follow-stats";

export function FollowStats({ uid }: { uid: string }) {
  const { counts, error } = useFollowStats(uid);
  return (
    <div className="follow-stats">
      <div className="follow-stats-row">
        <Link to={`/people/${uid}/followers`}>
          <strong>{counts?.followers ?? "–"}</strong> Followers
        </Link>
        <Link to={`/people/${uid}/following`}>
          <strong>{counts?.following ?? "–"}</strong> Following
        </Link>
      </div>
      {error ? <p role="alert">{error}</p> : null}
    </div>
  );
}
