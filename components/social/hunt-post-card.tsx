import { UserRound } from "lucide-react";
import { Link } from "react-router-dom";

import type { PublicHunt } from "@/lib/domain/public-social";

export function HuntPostCard({ hunt }: { hunt: PublicHunt }) {
  const cover = hunt.media.find(
    (media) => media.id === hunt.coverMediaId && media.kind === "photo",
  );
  const huntUrl = `/people/${hunt.ownerId}/hunts/${hunt.id}`;
  return (
    <article className="post-card">
      <Link className="post-hunter" to={`/people/${hunt.ownerId}`}>
        <span className="account-avatar">
          {hunt.hunter.avatarUrl ? (
            <img src={hunt.hunter.avatarUrl} alt="" />
          ) : (
            <UserRound aria-hidden="true" />
          )}
        </span>
        <span>
          <strong>{hunt.hunter.displayName}</strong>
          <small>
            {hunt.location.farmName || hunt.location.placeName} · {hunt.date}
          </small>
        </span>
      </Link>
      <Link
        className="social-cover"
        to={huntUrl}
        aria-label={`${hunt.species} hunt by ${hunt.hunter.displayName}`}
        style={cover ? { backgroundImage: `url(${cover.downloadUrl})` } : undefined}
      />
      <Link className="post-copy" to={huntUrl}>
        <strong>{hunt.species}</strong>
        <small>
          {hunt.country} · {hunt.weapon.model}
        </small>
      </Link>
    </article>
  );
}
