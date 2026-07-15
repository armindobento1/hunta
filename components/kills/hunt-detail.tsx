import { ArrowLeft, Edit3, Route, Trash2 } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { RouteMap } from "@/components/map/route-map";
import type { Kill } from "@/lib/domain/kill";

import { HuntFacts } from "./hunt-facts";
import { MediaGallery } from "./media-gallery";
import { TrashDialog } from "./trash-dialog";

function routeDuration(minutes: number | null): string {
  if (minutes === null) return "Duration unavailable";
  const rounded = Math.round(minutes);
  const hours = Math.floor(rounded / 60);
  const rest = rounded % 60;
  return hours ? `${hours}h ${rest}m` : `${rest}m`;
}

export function HuntDetail({
  kill,
  onTrash,
  mapSlot,
}: {
  kill: Kill;
  onTrash(): Promise<void> | void;
  mapSlot?: ReactNode;
}) {
  const [confirmingTrash, setConfirmingTrash] = useState(false);
  const cover = kill.media.find((asset) => asset.id === kill.coverMediaId);

  return (
    <main className="hunt-detail">
      <header
        className="hunt-hero"
        style={
          cover?.kind === "photo"
            ? { backgroundImage: `url(${cover.downloadUrl})` }
            : undefined
        }
      >
        <div className="hunt-hero-nav">
          <Link to="/portfolio">
            <ArrowLeft aria-hidden="true" /> Portfolio
          </Link>
          <Link to={`/portfolio/kills/${kill.id}/edit`}>
            <Edit3 aria-hidden="true" /> Edit
          </Link>
        </div>
        <div className="hunt-hero-copy">
          <p>{kill.country}</p>
          <h1>{kill.species}</h1>
          <span>
            {kill.location.placeName} · {kill.date}
          </span>
        </div>
      </header>

      <div className="detail-content">
        <HuntFacts kill={kill} />
        {kill.description ? (
          <section className="story-panel">
            <p className="eyebrow">The hunt</p>
            <p>{kill.description}</p>
          </section>
        ) : null}
        <MediaGallery kill={kill} />
        {kill.route ? (
          <section className="route-panel">
            <div className="route-heading">
              <div>
                <p className="eyebrow">Original GPX preserved</p>
                <h2>Walk route</h2>
              </div>
              <div className="route-metrics">
                <span>
                  <Route aria-hidden="true" />
                  <strong>{kill.route.distanceKm.toFixed(1)} km</strong>
                </span>
                <span>
                  <strong>{routeDuration(kill.route.durationMin)}</strong>
                </span>
              </div>
            </div>
            {mapSlot ?? <RouteMap kill={kill} />}
          </section>
        ) : null}
        <div className="detail-danger-zone">
          <div>
            <strong>Move this record to trash</strong>
            <span>Facts and attachments stay recoverable.</span>
          </div>
          <Button variant="danger" onClick={() => setConfirmingTrash(true)}>
            <Trash2 aria-hidden="true" size={16} /> Move to trash
          </Button>
        </div>
      </div>
      {confirmingTrash ? (
        <TrashDialog
          species={kill.species}
          isPublic={kill.isPublic}
          onCancel={() => setConfirmingTrash(false)}
          onConfirm={onTrash}
        />
      ) : null}
    </main>
  );
}
