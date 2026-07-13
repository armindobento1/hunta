import { Bookmark, Heart, MessageCircle, MoreHorizontal, Play, Volume2, VolumeX } from "lucide-react";
import { useRef, useState, type UIEvent } from "react";
import { Link, useNavigate } from "react-router-dom";

import { CommentSection } from "@/components/social/hunt-engagement";
import { GearSpec } from "@/components/kills/gear-spec";
import type { PublicHunt } from "@/lib/domain/public-social";
import { useHuntEngagement } from "@/lib/hooks/use-engagement";
import { useViewerFollowing } from "@/lib/hooks/use-viewer-following";
import { formatScore } from "@/lib/ui/format-score";
import { initials } from "@/lib/ui/initials";

function formatSeconds(total: number): string {
  const minutes = Math.floor(total / 60);
  const seconds = String(Math.floor(total % 60)).padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function VideoSlide({ url, active }: { url: string; active: boolean }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState<string | null>(null);
  return (
    <div className="hd-slide">
      <video
        ref={ref}
        src={url}
        muted={muted}
        loop
        playsInline
        autoPlay={active}
        onLoadedMetadata={(event) => setDuration(formatSeconds(event.currentTarget.duration))}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onClick={() => {
          const video = ref.current;
          if (!video) return;
          if (video.paused) void video.play();
          else video.pause();
        }}
      />
      <span className="hd-pill">VIDEO</span>
      {!playing ? <span className="hd-play" aria-hidden="true"><Play /></span> : null}
      {duration ? <span className="hd-duration">{duration}</span> : null}
      <button type="button" className="hd-mute" aria-label={muted ? "Unmute" : "Mute"} onClick={() => setMuted((value) => !value)}>
        {muted ? <VolumeX aria-hidden="true" /> : <Volume2 aria-hidden="true" />}
      </button>
    </div>
  );
}

export function PublicHuntDetail({ hunt }: { hunt: PublicHunt }) {
  const navigate = useNavigate();
  const viewer = useViewerFollowing();
  const engagement = useHuntEngagement(hunt);
  const [slide, setSlide] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const commentsRef = useRef<HTMLDivElement>(null);
  const { likes, likedByMe, viewerId, toggleLike } = engagement;

  const canFollow = Boolean(viewer.viewerId && viewer.viewerId !== hunt.ownerId && viewer.followingIds);
  const isFollowing = Boolean(viewer.followingIds?.includes(hunt.ownerId));
  const score = hunt.measurement?.score
    ? `${hunt.measurement.scoringSystem ?? ""} ${formatScore(hunt.measurement.score, hunt.measurement.scoreUnit)}`.trim()
    : null;
  const media = hunt.media;
  const others = likes.filter((like) => like.likerId !== viewerId);
  const likerNames = [
    ...(likedByMe ? ["you"] : []),
    ...others.slice(0, 2).map((like) => like.likerName.split(/\s+/)[0]),
  ];
  const likerRest = others.length - Math.min(others.length, 2);

  function onCarouselScroll(event: UIEvent<HTMLDivElement>) {
    const track = event.currentTarget;
    setSlide(Math.min(media.length - 1, Math.round(track.scrollLeft / track.clientWidth)));
  }

  async function copyHuntLink() {
    setMenuOpen(false);
    await navigator.clipboard.writeText(window.location.href);
    setNotice("Hunt link copied.");
  }

  return (
    <main className="hd-shell">
      <div className="hd-head">
        <button type="button" className="cmt-back" aria-label="Back" onClick={() => navigate(-1)} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="hd-eyebrow">HUNT</div>
          <div className="hd-title">{hunt.species}</div>
        </div>
        <button type="button" className="ppf-menu-btn" aria-label="More options" onClick={() => setMenuOpen((value) => !value)}>
          <MoreHorizontal aria-hidden="true" />
        </button>
        {menuOpen ? (
          <div className="ppf-menu" role="menu">
            <button type="button" role="menuitem" onClick={() => void copyHuntLink()}>Copy hunt link</button>
          </div>
        ) : null}
      </div>
      <div className="hd-author">
        <Link className="soc-avatar" to={`/people/${hunt.ownerId}`} aria-label={hunt.hunter.displayName}>
          {hunt.hunter.avatarUrl ? <img src={hunt.hunter.avatarUrl} alt="" /> : initials(hunt.hunter.displayName)}
        </Link>
        <Link className="soc-post-id" to={`/people/${hunt.ownerId}`}>
          <strong>{hunt.hunter.displayName}</strong>
          <small>{hunt.location.farmName || hunt.location.placeName} · {hunt.country}</small>
        </Link>
        {canFollow ? (
          <button
            type="button"
            className={`hd-follow-pill${isFollowing ? " hd-following" : ""}`}
            onClick={() => void viewer.toggle(hunt.ownerId)}
          >
            {isFollowing ? "Following" : "Follow"}
          </button>
        ) : null}
      </div>
      {notice ? <p role="status" style={{ padding: "0 16px" }}>{notice}</p> : null}
      {viewer.error ? <p role="alert" style={{ padding: "0 16px" }}>{viewer.error}</p> : null}

      <div className="hd-carousel">
        <div className="hd-track" onScroll={onCarouselScroll}>
          {media.length === 0 ? (
            <div className="hd-slide"><span className="soc-media-empty">{hunt.species}</span></div>
          ) : (
            media.map((item, index) =>
              item.kind === "video" ? (
                <VideoSlide key={item.id} url={item.downloadUrl} active={slide === index} />
              ) : (
                <div className="hd-slide" key={item.id}>
                  <img src={item.downloadUrl} alt={`${hunt.species} — media ${index + 1} of ${media.length}`} loading={index === 0 ? "eager" : "lazy"} />
                  {score ? <span className="hd-pill">{score}</span> : null}
                </div>
              ),
            )
          )}
        </div>
        {media.length > 1 ? <span className="hd-counter">{slide + 1}/{media.length}</span> : null}
      </div>

      <div className="hd-actionbar">
        <div>
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
          <button
            type="button"
            className="soc-action"
            aria-label="Comments"
            onClick={() => commentsRef.current?.scrollIntoView({ behavior: "smooth" })}
          >
            <MessageCircle aria-hidden="true" />
          </button>
        </div>
        {media.length > 1 ? (
          <div className="hd-dots" aria-hidden="true">
            {media.map((item, index) => <span key={item.id} className={`hd-dot${slide === index ? " hd-dot-active" : ""}`} />)}
          </div>
        ) : null}
        <div>
          {/* Saving hunts has no backend yet — placeholder per design, disabled. */}
          <button type="button" className="soc-action" disabled aria-label="Save — coming soon" title="Save — coming soon">
            <Bookmark aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="hd-body">
        <div>
          <b>{likes.length} like{likes.length === 1 ? "" : "s"}</b>
          {likerNames.length > 0 ? (
            <span className="cmt-likerow-names"> · {likerNames.join(", ")}{likerRest > 0 ? ` and ${likerRest} others` : ""}</span>
          ) : null}
        </div>
        {hunt.description ? <div style={{ marginTop: 8 }}>{hunt.description}</div> : null}
      </div>

      <section className="hd-gear" aria-label="Gear and facts">
        <GearSpec
          weapon={hunt.weapon}
          ammunition={hunt.ammunition}
          attachments={hunt.equipmentAttachments}
          extra={[
            ...(score ? [{ label: "Score", value: score }] : []),
            ...(hunt.routeSummary ? [{ label: "Distance", value: `${hunt.routeSummary.distanceKm} km` }] : []),
            {
              label: "Date",
              value: new Date(`${hunt.date}T00:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }),
            },
            { label: "Location", value: hunt.location.farmName || hunt.location.placeName, sub: hunt.country },
          ]}
        />
      </section>

      <div ref={commentsRef} style={{ marginTop: 14, borderTop: "0.5px solid rgba(240, 234, 224, 0.08)" }}>
        <CommentSection hunt={hunt} engagement={engagement} />
      </div>
    </main>
  );
}
