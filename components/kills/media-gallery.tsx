"use client";

import { useState } from "react";

import type { Kill, MediaAsset } from "@/lib/domain/kill";

export function MediaGallery({ kill }: { kill: Kill }) {
  const initial = kill.media.find((asset) => asset.id === kill.coverMediaId) ?? kill.media[0];
  const [selected, setSelected] = useState<MediaAsset | undefined>(initial);

  return (
    <section className="media-gallery" aria-label="Hunt media">
      {selected?.kind === "video" ? (
        <video className="detail-media" controls src={selected.downloadUrl}>
          <track kind="captions" />
        </video>
      ) : (
        <div
          className="detail-media detail-photo"
          role="img"
          aria-label={selected?.fileName || `${kill.species} cover`}
          style={
            selected ? { backgroundImage: `url(${selected.downloadUrl})` } : undefined
          }
        />
      )}
      {kill.media.length > 1 ? (
        <div className="gallery-strip">
          {kill.media.map((asset) => (
            <button
              type="button"
              key={asset.id}
              aria-label={`Show ${asset.fileName}`}
              aria-pressed={selected?.id === asset.id}
              onClick={() => setSelected(asset)}
              style={
                asset.kind === "photo"
                  ? { backgroundImage: `url(${asset.downloadUrl})` }
                  : undefined
              }
            >
              {asset.kind === "video" ? "Video" : null}
            </button>
          ))}
        </div>
      ) : null}
    </section>
  );
}
