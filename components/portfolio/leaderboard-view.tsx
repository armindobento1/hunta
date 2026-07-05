import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

import type { Kill } from "@/lib/domain/kill";
import { sortActiveKills } from "@/lib/domain/selectors";

function rankedKills(kills: readonly Kill[]): Kill[] {
  return sortActiveKills(kills)
    .filter((kill) => typeof kill.measurement?.score === "number")
    .sort(
      (left, right) =>
        (right.measurement?.score ?? 0) - (left.measurement?.score ?? 0),
    );
}

function scoreLabel(kill: Kill): string {
  const score = kill.measurement?.score;
  return score === undefined
    ? "—"
    : `${score} ${kill.measurement?.scoreUnit || "pts"}`;
}

export function LeaderboardView({ kills }: { kills: readonly Kill[] }) {
  const ranked = useMemo(() => rankedKills(kills), [kills]);
  const species = useMemo(
    () => [...new Set(ranked.map((kill) => kill.species))],
    [ranked],
  );
  const [selectedSpecies, setSelectedSpecies] = useState<string | null>(null);
  const activeSpecies =
    selectedSpecies && species.includes(selectedSpecies)
      ? selectedSpecies
      : (species[0] ?? null);
  const visible = ranked.filter((kill) => kill.species === activeSpecies);

  return (
    <section className="lb-view" aria-labelledby="leaderboard-heading">
      <header className="lb-header">
        <p className="lb-season">PRIVATE PORTFOLIO · VERIFIED RECORDS</p>
        <h1 id="leaderboard-heading" className="lb-title">Personal bests</h1>
        <p className="lb-intro">
          Trophy rankings use only the measurements saved on your own hunts.
        </p>
      </header>
      {species.length === 0 ? (
        <div className="lb-empty">
          <span className="lb-empty-medal" aria-hidden="true">01</span>
          <h2>No measured trophies yet</h2>
          <p>Add a real score to a hunt record to build your private rankings.</p>
          <Link to="/portfolio">Back to your feed</Link>
        </div>
      ) : (
        <>
          <div className="lb-species-scroll" aria-label="Species rankings">
            {species.map((item) => (
              <button
                key={item}
                type="button"
                className={`lb-species-pill${item === activeSpecies ? " lb-species-active" : ""}`}
                aria-pressed={item === activeSpecies}
                onClick={() => setSelectedSpecies(item)}
              >
                {item}
              </button>
            ))}
          </div>
          <div className="lb-ranked-row">
            <strong>{activeSpecies}</strong>
            <span>RANKED BY SAVED SCORE</span>
          </div>
          <div className="lb-list-wrap">
            <div className="lb-list">
              {visible.map((kill, index) => {
                const cover = kill.media.find(
                  (asset) => asset.id === kill.coverMediaId && asset.kind === "photo",
                );
                return (
                  <Link
                    key={kill.id}
                    className={`lb-row${index === 0 ? " lb-row-first" : ""}`}
                    to={`/portfolio/kills/${kill.id}`}
                  >
                    <span className="lb-rank">{String(index + 1).padStart(2, "0")}</span>
                    <span
                      className="lb-row-thumb"
                      aria-hidden="true"
                      style={cover ? { backgroundImage: `url(${cover.downloadUrl})` } : undefined}
                    />
                    <span className="lb-row-info">
                      <strong>{kill.location.farmName || kill.location.placeName}</strong>
                      <span>{kill.country} · {kill.date}</span>
                    </span>
                    <span className="lb-row-score">{scoreLabel(kill)}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </>
      )}
    </section>
  );
}
