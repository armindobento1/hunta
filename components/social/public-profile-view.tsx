import { Link } from "react-router-dom";
import { UserRound } from "lucide-react";
import type { PublicHunt, PublicProfile } from "@/lib/domain/public-social";

export function PublicProfileView({ profile, hunts }: { profile: PublicProfile; hunts: PublicHunt[] }) {
  return <main className="public-page"><header className="public-profile-header"><span className="public-avatar">{profile.avatarUrl ? <img src={profile.avatarUrl} alt="" /> : <UserRound />}</span><div><p>PUBLIC HUNTER</p><h1>{profile.displayName}</h1><span>{profile.bio}</span></div></header><nav className="public-nav"><Link to="/portfolio">Open Hunta</Link><Link to="/portfolio/leaderboard">Leaderboard</Link></nav><section className="public-hunts"><h2>Published hunts</h2>{hunts.length === 0 ? <p>No published hunts yet.</p> : hunts.map((hunt) => <Link key={hunt.id} to={`/people/${hunt.ownerId}/hunts/${hunt.id}`}><strong>{hunt.species}</strong><span>{hunt.location.farmName || hunt.location.placeName} · {hunt.date}</span></Link>)}</section></main>;
}
