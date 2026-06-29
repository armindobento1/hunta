import Link from "next/link";

import type { Kill } from "@/lib/domain/kill";

function formatDate(date: string): string {
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(`${date}T00:00:00`));
}

function weaponLabel(kill: Kill): string {
  return kill.weapon.type === "rifle" ? kill.weapon.caliber : "Bow";
}

export function KillCard({ kill, compact = false }: { kill: Kill; compact?: boolean }) {
  const cover = kill.media.find((asset) => asset.id === kill.coverMediaId);
  return (
    <Link
      className={compact ? "kill-card kill-card-compact" : "kill-card"}
      href={`/portfolio/kills/${kill.id}`}
      aria-label={`View ${kill.species} hunt`}
    >
      <div
        className="kill-cover"
        style={
          cover?.kind === "photo"
            ? { backgroundImage: `url(${cover.downloadUrl})` }
            : undefined
        }
      >
        <span className="weapon-badge">{weaponLabel(kill)}</span>
        <div className="kill-card-copy">
          <strong>{kill.species}</strong>
          <span>
            {kill.location.placeName} · {formatDate(kill.date)}
          </span>
        </div>
      </div>
    </Link>
  );
}
