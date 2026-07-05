import { Link } from "react-router-dom";

import type { Kill } from "@/lib/domain/kill";

type KillCardVariant = "overlay" | "below" | "compact" | "grid";

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

export function KillCard({
  kill,
  variant = "overlay",
}: {
  kill: Kill;
  variant?: KillCardVariant;
}) {
  const cover = kill.media.find((asset) => asset.id === kill.coverMediaId);
  const coverStyle =
    cover?.kind === "photo"
      ? { backgroundImage: `url(${cover.downloadUrl})` }
      : undefined;
  const location = kill.location.farmName || kill.location.placeName;
  const date = formatDate(kill.date);
  const caliber = weaponLabel(kill);

  if (variant === "compact") {
    return (
      <Link
        className="kill-card kill-card-compact"
        to={`/portfolio/kills/${kill.id}`}
        aria-label={`View ${kill.species} hunt`}
      >
        <span className="kill-thumb" style={coverStyle} aria-hidden="true" />
        <span className="kill-card-compact-body">
          <strong>{kill.species}</strong>
          <span>{location} · {date}</span>
        </span>
        <span className="compact-cal">{caliber}</span>
        <span className="compact-chevron" aria-hidden="true" />
      </Link>
    );
  }

  if (variant === "below") {
    return (
      <Link
        className="kill-card kill-card-below"
        to={`/portfolio/kills/${kill.id}`}
        aria-label={`View ${kill.species} hunt`}
      >
        <span className="kill-cover-img kill-cover-img-below" style={coverStyle} />
        <span className="kill-card-below-body">
          <span>
            <strong>{kill.species}</strong>
            <span>{location} · {date}</span>
          </span>
          <span className="weapon-badge-tint">{caliber}</span>
        </span>
      </Link>
    );
  }

  return (
    <Link
      className={`kill-card kill-card-${variant}`}
      to={`/portfolio/kills/${kill.id}`}
      aria-label={`View ${kill.species} hunt`}
    >
      <span className="kill-cover-img" style={coverStyle}>
        <span className={`weapon-badge${variant === "grid" ? " weapon-badge-sm" : ""}`}>
          {caliber}
        </span>
        <span className="kill-card-copy">
          <strong>{kill.species}</strong>
          <span>{variant === "grid" ? date : `${location} · ${date}`}</span>
        </span>
      </span>
    </Link>
  );
}
