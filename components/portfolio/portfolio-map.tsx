import { useEffect, useMemo, useRef, useState } from "react";

import type { Kill } from "@/lib/domain/kill";
import { sortActiveKills } from "@/lib/domain/selectors";

const DEFAULT_TILE_URL =
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";

export function PortfolioMap({ kills }: { kills: readonly Kill[] }) {
  const activeKills = useMemo(() => sortActiveKills(kills), [kills]);
  const container = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (activeKills.length === 0 || !container.current) return;
    let disposed = false;
    let cleanup: (() => void) | undefined;

    async function mount() {
      try {
        const { default: maplibregl } = await import("maplibre-gl");
        if (disposed || !container.current) return;
        const first = activeKills[0];
        const map = new maplibregl.Map({
          container: container.current,
          style: {
            version: 8,
            sources: {
              satellite: {
                type: "raster",
                tiles: [import.meta.env.VITE_SATELLITE_TILE_URL || DEFAULT_TILE_URL],
                tileSize: 256,
                attribution: "Tiles © Esri",
              },
            },
            layers: [{ id: "satellite", type: "raster", source: "satellite" }],
          },
          center: [first.location.longitude, first.location.latitude],
          zoom: 4,
        });
        cleanup = () => map.remove();
        map.once("load", () => {
          if (disposed) return;
          const bounds = new maplibregl.LngLatBounds();
          for (const kill of activeKills) {
            const coordinates: [number, number] = [
              kill.location.longitude,
              kill.location.latitude,
            ];
            bounds.extend(coordinates);
            new maplibregl.Marker({ color: "#6fbf8c" })
              .setLngLat(coordinates)
              .setPopup(
                new maplibregl.Popup({ offset: 20 }).setText(
                  `${kill.species} · ${kill.location.farmName || kill.location.placeName}`,
                ),
              )
              .addTo(map);
          }
          if (activeKills.length > 1) {
            map.fitBounds(bounds, { padding: 54, maxZoom: 11 });
          } else {
            map.setZoom(10);
          }
        });
      } catch {
        if (!disposed) setError("Your private hunt map is temporarily unavailable.");
      }
    }

    void mount();
    return () => {
      disposed = true;
      cleanup?.();
    };
  }, [activeKills]);

  return (
    <section className="portfolio-map-view" aria-labelledby="map-heading">
      <header className="map-page-header">
        <p className="mono-label">PRIVATE LOCATIONS</p>
        <h1 id="map-heading">Hunt map</h1>
        <p>Every pin comes directly from a location saved on your records.</p>
      </header>
      {activeKills.length === 0 ? (
        <div className="map-empty">
          <h2>No locations to map yet</h2>
          <p>Your map fills in as you add factual hunt locations.</p>
        </div>
      ) : error ? (
        <div className="map-empty" role="alert">{error}</div>
      ) : (
        <div className="portfolio-map-canvas" ref={container} aria-label="Private satellite hunt map" />
      )}
    </section>
  );
}
