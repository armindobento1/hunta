import { Link } from "react-router-dom";
import type { PublicHunt } from "@/lib/domain/public-social";

export function PublicHuntDetail({ hunt }: { hunt: PublicHunt }) {
  const cover = hunt.media.find((item) => item.id === hunt.coverMediaId && item.kind === "photo");
  return <main className="public-page public-hunt"><Link to={`/people/${hunt.ownerId}`}>← {hunt.hunter.displayName}</Link><div className="public-hunt-cover" style={cover ? { backgroundImage: `url(${cover.downloadUrl})` } : undefined} /><p>PUBLIC HUNT</p><h1>{hunt.species}</h1><dl><div><dt>Farm</dt><dd>{hunt.location.farmId ? <Link className="farm-link" to={`/farms/${hunt.location.farmId}`}>{hunt.location.farmName || hunt.location.placeName}</Link> : (hunt.location.farmName || hunt.location.placeName)}</dd></div><div><dt>Coordinates</dt><dd>{hunt.location.latitude}, {hunt.location.longitude}</dd></div><div><dt>Weapon</dt><dd>{hunt.weapon.model}</dd></div><div><dt>Date</dt><dd>{hunt.date} · {hunt.killTime}</dd></div>{hunt.measurement?.score ? <div><dt>Score</dt><dd>{hunt.measurement.score} {hunt.measurement.scoreUnit || "pts"}</dd></div> : null}</dl>{hunt.description ? <p className="public-story">{hunt.description}</p> : null}</main>;
}
