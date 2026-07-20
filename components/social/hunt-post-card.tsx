import { ChevronRight, Heart, MessageCircle } from "lucide-react";
import { useRef, useState, type PointerEvent } from "react";
import { Link } from "react-router-dom";

import type { PublicHunt } from "@/lib/domain/public-social";
import { useSocial } from "@/lib/hooks/use-social";
import { formatScore } from "@/lib/ui/format-score";
import { initials } from "@/lib/ui/initials";
import { relativeTime } from "@/lib/ui/relative-time";

function LikesLine({ likeCount, likedByMe, to }: { likeCount: number; likedByMe: boolean; to: string }) {
  if (likeCount === 0) return null;
  if (likedByMe) {
    const others = likeCount - 1;
    return (
      <Link className="soc-likers" to={to}>
        Liked by <b>you</b>
        {others > 0 ? <> and {others} other{others > 1 ? "s" : ""}</> : null}
      </Link>
    );
  }
  return <Link className="soc-likers" to={to}>{likeCount} like{likeCount > 1 ? "s" : ""}</Link>;
}

export function HuntPostCard({ hunt, imagePriority = false }: { hunt: PublicHunt; imagePriority?: boolean }) {
  const cover =
    hunt.media.find((media) => media.id === hunt.coverMediaId && media.kind === "photo") ??
    hunt.media.find((media) => media.kind === "photo");
  const huntUrl = `/people/${hunt.ownerId}/hunts/${hunt.id}`;
  // Counts come off the hunt doc (denormalized, live via the feed's single
  // listener); like state comes from the provider's one liked-set listener.
  // No per-card likes/comments listeners.
  const { likedIds, toggleLike } = useSocial();
  const likeCount = hunt.likeCount ?? 0;
  const commentCount = hunt.commentCount ?? 0;
  const likedByMe = likedIds.includes(hunt.id);
  const [burst, setBurst] = useState(false);
  const previousTap = useRef<{ time: number; x: number; y: number } | null>(null);
  const truncated = hunt.description.length > 140;
  const caption = truncated ? `${hunt.description.slice(0, 140).trimEnd()}…` : hunt.description;
  const score = hunt.measurement?.score
    ? `${hunt.measurement.scoringSystem ?? ""} ${formatScore(hunt.measurement.score, hunt.measurement.scoreUnit)}`.trim()
    : null;
  const stamp = `${new Date(`${hunt.date}T00:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })} · ${hunt.killTime}`;

  function doubleTapLike() {
    setBurst(true);
    setTimeout(() => setBurst(false), 650);
    if (!likedByMe) void toggleLike(hunt);
  }

  function handleMediaPointerUp(event: PointerEvent<HTMLDivElement>) {
    if (!event.isPrimary || event.button !== 0) return;
    const tap = { time: Date.now(), x: event.clientX, y: event.clientY };
    const previous = previousTap.current;
    if (
      previous &&
      tap.time - previous.time <= 300 &&
      Math.hypot(tap.x - previous.x, tap.y - previous.y) <= 24
    ) {
      previousTap.current = null;
      doubleTapLike();
      return;
    }
    previousTap.current = tap;
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
      <div className="soc-media" onPointerUp={handleMediaPointerUp}>
        {cover ? (
          <img
            src={cover.downloadUrl}
            alt={`${hunt.species} hunt by ${hunt.hunter.displayName}`}
            loading={imagePriority ? "eager" : "lazy"}
            fetchPriority={imagePriority ? "high" : "auto"}
            decoding="async"
          />
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
          aria-pressed={likedByMe}
          aria-label={likedByMe ? "Unlike" : "Like"}
          onClick={() => void toggleLike(hunt)}
        >
          <Heart aria-hidden="true" />
        </button>
        <Link className="soc-action" to={`${huntUrl}/comments`} aria-label="Comments">
          <MessageCircle aria-hidden="true" />
        </Link>
        {commentCount > 0 ? <span className="soc-count">{commentCount}</span> : null}
        <Link className="soc-open" to={huntUrl} aria-label={`View ${hunt.species} post details`}>
          View post <ChevronRight aria-hidden="true" />
        </Link>
      </div>
      <div className="soc-body">
        <LikesLine likeCount={likeCount} likedByMe={likedByMe} to={`${huntUrl}/likes`} />
        <Link to={huntUrl}>
          <b className="soc-species">{hunt.species}</b>&nbsp; {caption}
          {truncated ? <span className="soc-more"> more</span> : null}
        </Link>
        {commentCount > 0 ? (
          <Link className="soc-viewall" to={`${huntUrl}/comments`}>
            View all {commentCount} comment{commentCount > 1 ? "s" : ""}
          </Link>
        ) : null}
        <div className="soc-stamp">{stamp}</div>
      </div>
    </article>
  );
}
