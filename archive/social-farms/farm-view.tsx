import { Link } from "react-router-dom";
import { MapPin } from "lucide-react";

import { LocationPickerMap } from "@/components/map/location-picker-map";
import type { Farm } from "@/lib/domain/farm";
import type { PublicHunt } from "@/lib/domain/public-social";

export function FarmView({ farm, hunts }: { farm: Farm; hunts: PublicHunt[] }) {
  const species = [...new Set(hunts.map((hunt) => hunt.species))];
  return (
    <main className="public-page farm-page">
      <header className="farm-header">
        <p>COMMUNITY FARM</p>
        <h1>{farm.name}</h1>
        <span className="farm-place">
          <MapPin aria-hidden="true" size={14} /> {farm.placeName} · {farm.country}
        </span>
      </header>
      <LocationPickerMap latitude={farm.latitude} longitude={farm.longitude} />
      <section className="farm-stats">
        <div><strong>{hunts.length}</strong><span>published {hunts.length === 1 ? "hunt" : "hunts"}</span></div>
        <div><strong>{species.length}</strong><span>species</span></div>
      </section>
      {species.length ? (
        <p className="farm-species">{species.join(" · ")}</p>
      ) : null}
      <nav className="public-nav">
        <Link to="/portfolio">Open Hunta</Link>
        <Link to="/portfolio/leaderboard">Leaderboard</Link>
      </nav>
      <section className="public-hunts">
        <h2>Published hunts at this farm</h2>
        {hunts.length === 0 ? (
          <p>No published hunts yet.</p>
        ) : (
          hunts.map((hunt) => (
            <Link key={hunt.id} to={`/people/${hunt.ownerId}/hunts/${hunt.id}`}>
              <strong>{hunt.species}</strong>
              <span>{hunt.hunter.displayName} · {hunt.date}</span>
            </Link>
          ))
        )}
      </section>
    </main>
  );
}
