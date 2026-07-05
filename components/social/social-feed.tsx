import { useState } from "react";
import { Link } from "react-router-dom";

import type { PublicHunt } from "@/lib/domain/public-social";

export function SocialFeed({ hunts, currentUserId, followingIds }: { hunts: PublicHunt[]; currentUserId: string; followingIds: string[] }) {
  const [mode, setMode] = useState<"discover" | "following">("discover");
  const visible = mode === "discover" ? hunts : hunts.filter((hunt) => hunt.ownerId === currentUserId || followingIds.includes(hunt.ownerId));
  return <section className="social-feed" aria-label="Public hunt feed">
    <div className="social-feed-tabs"><button type="button" aria-pressed={mode === "following"} onClick={() => setMode("following")}>Following</button><button type="button" aria-pressed={mode === "discover"} onClick={() => setMode("discover")}>Discover</button></div>
    {visible.length === 0 ? <div className="social-empty"><strong>No published hunts here yet.</strong><span>Search for hunters to follow or browse Discover.</span></div> : <div className="social-feed-list">{visible.map((hunt) => {
      const cover = hunt.media.find((media) => media.id === hunt.coverMediaId && media.kind === "photo");
      return <Link className="social-hunt-card" key={hunt.id} to={`/people/${hunt.ownerId}/hunts/${hunt.id}`}><span className="social-hunter"><strong>{hunt.hunter.displayName}</strong><small>{hunt.location.farmName || hunt.location.placeName} · {hunt.date}</small></span><span className="social-cover" style={cover ? { backgroundImage: `url(${cover.downloadUrl})` } : undefined} /><span className="social-hunt-copy"><strong>{hunt.species}</strong><small>{hunt.country} · {hunt.weapon.model}</small></span></Link>;
    })}</div>}
  </section>;
}
