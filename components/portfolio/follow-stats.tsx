import { Link } from "react-router-dom";

import { useFollowStats } from "@/lib/hooks/use-follow-stats";

export function FollowStats({ uid }: { uid: string }) {
  const { counts, people, error, toggleList } = useFollowStats(uid);
  return (
    <div className="follow-stats">
      <div className="follow-stats-row">
        <button type="button" onClick={() => void toggleList("followers")}>
          <strong>{counts?.followers ?? "–"}</strong> Followers
        </button>
        <button type="button" onClick={() => void toggleList("following")}>
          <strong>{counts?.following ?? "–"}</strong> Following
        </button>
      </div>
      {error ? <p role="alert">{error}</p> : null}
      {people ? (
        <ul className="follow-people" aria-label={people.kind}>
          {people.list.length === 0 ? (
            <li>No {people.kind} yet.</li>
          ) : (
            people.list.map((person) => (
              <li key={person.id}>
                <Link to={`/people/${person.id}`}>{person.displayName}</Link>
              </li>
            ))
          )}
        </ul>
      ) : null}
    </div>
  );
}
