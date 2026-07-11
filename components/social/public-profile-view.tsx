import { Copy, MoreHorizontal, Play, Share2 } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import type { PublicHunt, PublicProfile } from "@/lib/domain/public-social";
import { useFollowStats } from "@/lib/hooks/use-follow-stats";
import { useViewerFollowing } from "@/lib/hooks/use-viewer-following";
import { initials } from "@/lib/ui/initials";

function huntCover(hunt: PublicHunt) {
  return (
    hunt.media.find((item) => item.id === hunt.coverMediaId && item.kind === "photo") ??
    hunt.media.find((item) => item.kind === "photo")
  );
}

export function PublicProfileView({ profile, hunts }: { profile: PublicProfile; hunts: PublicHunt[] }) {
  const navigate = useNavigate();
  const { counts } = useFollowStats(profile.id);
  const viewer = useViewerFollowing();
  const [menuOpen, setMenuOpen] = useState(false);
  const [speciesFilter, setSpeciesFilter] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const canFollow = Boolean(viewer.viewerId && viewer.viewerId !== profile.id && viewer.followingIds);
  const isFollowing = Boolean(viewer.followingIds?.includes(profile.id));
  const highlights = useMemo(() => {
    const bySpecies = new Map<string, { species: string; coverUrl: string | null; featured: boolean }>();
    for (const hunt of hunts) {
      const entry = bySpecies.get(hunt.species);
      if (!entry) {
        bySpecies.set(hunt.species, {
          species: hunt.species,
          coverUrl: huntCover(hunt)?.downloadUrl ?? null,
          featured: Boolean(hunt.measurement?.score),
        });
      } else if (hunt.measurement?.score) {
        entry.featured = true;
      }
    }
    return [...bySpecies.values()];
  }, [hunts]);
  const visibleHunts = speciesFilter ? hunts.filter((hunt) => hunt.species === speciesFilter) : hunts;

  async function copyProfileLink() {
    setMenuOpen(false);
    await navigator.clipboard.writeText(window.location.href);
    setNotice("Profile link copied.");
  }

  async function shareProfile() {
    const url = window.location.href;
    // A cancelled native share throws AbortError — that is not an error state.
    try {
      if (navigator.share) await navigator.share({ title: `${profile.displayName} on Hunta`, url });
      else {
        await navigator.clipboard.writeText(url);
        setNotice("Profile link copied.");
      }
    } catch {
      return;
    }
  }

  return (
    <main className="public-page ig-profile">
      <header className="ppf-head" style={{ position: "relative" }}>
        <button type="button" className="cmt-back" aria-label="Back" onClick={() => navigate(-1)} />
        <strong style={{ flex: 1 }}>{profile.displayName}</strong>
        <button type="button" className="ppf-menu-btn" aria-label="More options" onClick={() => setMenuOpen((value) => !value)}>
          <MoreHorizontal aria-hidden="true" />
        </button>
        {menuOpen ? (
          <div className="ppf-menu" role="menu">
            <button type="button" role="menuitem" onClick={() => void copyProfileLink()}>Copy profile link</button>
          </div>
        ) : null}
      </header>
      <div className="ig-head">
        <span className="public-avatar">
          {profile.avatarUrl ? <img src={profile.avatarUrl} alt="" /> : initials(profile.displayName)}
        </span>
        <div className="ig-stats">
          <div>
            <strong>{hunts.length}</strong>
            <span>Hunts</span>
          </div>
          <button type="button" onClick={() => navigate(`/people/${profile.id}/followers`)}>
            <strong>{counts?.followers ?? "–"}</strong>
            <span>Followers</span>
          </button>
          <button type="button" onClick={() => navigate(`/people/${profile.id}/following`)}>
            <strong>{counts?.following ?? "–"}</strong>
            <span>Following</span>
          </button>
        </div>
      </div>
      <div className="ig-identity">
        <h1>{profile.displayName}</h1>
        {profile.bio ? <p>{profile.bio}</p> : null}
      </div>
      <div className="ppf-actions">
        {canFollow ? (
          <button
            type="button"
            className={`ig-follow-btn${isFollowing ? " ig-following" : ""}`}
            onClick={() => void viewer.toggle(profile.id)}
          >
            {isFollowing ? "Following" : "Follow"}
          </button>
        ) : null}
        <button type="button" className="ppf-share" aria-label="Share profile" onClick={() => void shareProfile()}>
          <Share2 aria-hidden="true" />
        </button>
      </div>
      {viewer.error ? <p role="alert">{viewer.error}</p> : null}
      {notice ? <p role="status">{notice}</p> : null}
      {highlights.length > 0 ? (
        <div className="hl-row" aria-label="Species highlights">
          {highlights.map((highlight) => (
            <button
              key={highlight.species}
              type="button"
              className={`hl-item${highlight.featured ? " hl-featured" : ""}${speciesFilter === highlight.species ? " hl-active" : ""}`}
              aria-pressed={speciesFilter === highlight.species}
              onClick={() => setSpeciesFilter((current) => (current === highlight.species ? null : highlight.species))}
            >
              <span className="hl-thumb">
                {highlight.coverUrl ? <img src={highlight.coverUrl} alt="" /> : <span aria-hidden="true" />}
              </span>
              <span className="hl-label">{highlight.species}</span>
            </button>
          ))}
        </div>
      ) : null}
      {/* No public map view: public hunts carry no coordinates by design. */}
      {(
        <section className="ig-grid" style={{ marginTop: 2, borderRadius: 0 }} aria-label="Published hunts">
          {visibleHunts.length === 0 ? (
            <p className="ig-empty">No published hunts yet.</p>
          ) : (
            visibleHunts.map((hunt) => {
              const cover = huntCover(hunt);
              const hasVideo = hunt.media.some((item) => item.kind === "video");
              const multi = hunt.media.length > 1;
              return (
                <Link
                  key={hunt.id}
                  className="ig-tile"
                  to={`/people/${hunt.ownerId}/hunts/${hunt.id}`}
                  style={cover ? { backgroundImage: `url(${cover.downloadUrl})` } : undefined}
                >
                  {hasVideo ? (
                    <span className="ig-tile-badge"><Play aria-hidden="true" fill="currentColor" /></span>
                  ) : multi ? (
                    <span className="ig-tile-badge"><Copy aria-hidden="true" /></span>
                  ) : null}
                  <span className="ig-tile-label">{hunt.species}</span>
                </Link>
              );
            })
          )}
        </section>
      )}
    </main>
  );
}
