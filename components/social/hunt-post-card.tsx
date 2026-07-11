import { Heart, MessageCircle } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

import type { PublicHunt } from "@/lib/domain/public-social";
import { useHuntEngagement } from "@/lib/hooks/use-engagement";
import { initials } from "@/lib/ui/initials";
import { relativeTime } from "@/lib/ui/relative-time";

function LikersLine({ likes, likedByMe, viewerId }: { likes: { likerId: string; likerName: string }[]; likedByMe: boolean; viewerId: string | null }) {
  if (likes.length === 0) return null;
  const others = likes.filter((like) => like.likerId !== viewerId);
  const first = others[0];
  const restCount = others.length - (first ? 1 : 0);
  return (
    <div className="soc-likers">
      Liked by {likedByMe ? <b>you</b> : null}
      {likedByMe && first ? ", " : null}
      {first ? <b>{first.likerName}</b> : null}
      {restCount > 0 ? <> and {restCount} other{restCount > 1 ? "s" : ""}</> : null}
    </div>
  );
}

export function HuntPostCard({ hunt }: { hunt: PublicHunt }) {
  const cover =
    hunt.media.find((media) => media.id === hunt.coverMediaId && media.kind === "photo") ??
    hunt.media.find((media) => media.kind === "photo");
  const huntUrl = `/people/${hunt.ownerId}/hunts/${hunt.id}`;
  const { likes, comments, likedByMe, viewerId, toggleLike } = useHuntEngagement(hunt);
  const [burst, setBurst] = useState(false);
  const truncated = hunt.description.length > 140;
  const caption = truncated ? `${hunt.description.slice(0, 140).trimEnd()}…` : hunt.description;
  const score = hunt.measurement?.score
    ? `${hunt.measurement.scoringSystem ?? ""} ${hunt.measurement.score}${hunt.measurement.scoreUnit ? ` ${hunt.measurement.scoreUnit}` : ""}`.trim()
    : null;
  const stamp = `${new Date(`${hunt.date}T00:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })} · ${hunt.killTime}`;

  function doubleTapLike() {
    setBurst(true);
    setTimeout(() => setBurst(false), 650);
    if (viewerId && !likedByMe) void toggleLike();
  }

  return (
    <article className="soc-post">
      <div className="soc-post-head">
        <Link className="soc-avatar" to={`/people/${hunt.ownerId}`} aria-label={hunt.hunter.displayName}>
          {hunt.hunter.avatarUrl ? <img src={hunt.hunter.avatarUrl} alt="" /> : initials(hunt.hunter.displayName)}
        </Link>
        <Link className="soc-post-id" to={`/people/${hunt.ownerId}`}>
          <strong>{hunt.hunter.displayName}</strong>
          <small>{hunt.location.farmName || hunt.location.placeName} · {hunt.country}</small>
        </Link>
        <span className="soc-time">{relativeTime(hunt.publishedAt)}</span>
      </div>
      <div className="soc-media" onDoubleClick={doubleTapLike}>
        {cover ? (
          <img src={cover.downloadUrl} alt={`${hunt.species} hunt by ${hunt.hunter.displayName}`} loading="lazy" />
        ) : (
          <span className="soc-media-empty">{hunt.species}</span>
        )}
        {score ? <span className="soc-score">{score}</span> : null}
        {burst ? <Heart className="soc-heart-burst" aria-hidden="true" /> : null}
      </div>
      <div className="soc-actions">
        <button
          type="button"
          className={`soc-action${likedByMe ? " soc-liked" : ""}`}
          disabled={!viewerId}
          aria-pressed={likedByMe}
          aria-label={likedByMe ? "Unlike" : "Like"}
          onClick={() => void toggleLike()}
        >
          <Heart aria-hidden="true" />
        </button>
        <Link className="soc-action" to={`${huntUrl}/comments`} aria-label="Comments">
          <MessageCircle aria-hidden="true" />
        </Link>
        {comments.length > 0 ? <span className="soc-count">{comments.length}</span> : null}
      </div>
      <div className="soc-body">
        <LikersLine likes={likes} likedByMe={likedByMe} viewerId={viewerId} />
        <Link to={huntUrl}>
          <b className="soc-species">{hunt.species}</b>&nbsp; {caption}
          {truncated ? <span className="soc-more"> more</span> : null}
        </Link>
        {comments.length > 0 ? (
          <Link className="soc-viewall" to={`${huntUrl}/comments`}>
            View all {comments.length} comment{comments.length > 1 ? "s" : ""}
          </Link>
        ) : null}
        <div className="soc-stamp">{stamp}</div>
      </div>
    </article>
  );
}
