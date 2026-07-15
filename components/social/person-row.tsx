import { Link } from "react-router-dom";

import type { FollowPerson } from "@/lib/firebase/follow-repository";
import { initials } from "@/lib/ui/initials";

export function PersonRow({
  person,
  viewerId,
  followingIds,
  onToggle,
}: {
  person: FollowPerson;
  viewerId: string | null;
  followingIds: string[] | null;
  onToggle(id: string): void;
}) {
  const isFollowing = followingIds?.includes(person.id) ?? false;
  return (
    <li className="ppl-row">
      <span className="ppl-avatar" aria-hidden="true">
        {person.avatarUrl ? <img src={person.avatarUrl} alt="" /> : initials(person.displayName)}
      </span>
      <Link className="ppl-name" to={`/people/${person.id}`}>{person.displayName}</Link>
      {viewerId && viewerId !== person.id && followingIds ? (
        <button
          type="button"
          className={`ppl-btn${isFollowing ? " ppl-btn-following" : ""}`}
          onClick={() => onToggle(person.id)}
        >
          {isFollowing ? "Following" : "Follow"}
        </button>
      ) : null}
    </li>
  );
}
