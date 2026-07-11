import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import type { PublicHunt } from "@/lib/domain/public-social";

const DEFAULT_TILE_URL =
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";

export function PublicHuntsMap({ hunts }: { hunts: PublicHunt[] }) {
  const container = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!container.current || hunts.length === 0) return;
    let disposed = false;
    let cleanup: (() => void) | undefined;

    async function mount() {
      try {
        const { default: maplibregl } = await import("maplibre-gl");
        if (disposed || !container.current) return;
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
          center: [hunts[0].location.longitude, hunts[0].location.latitude],
          zoom: 4,
        });
        cleanup = () => map.remove();
        const bounds = new maplibregl.LngLatBounds();
        for (const hunt of hunts) {
          bounds.extend([hunt.location.longitude, hunt.location.latitude]);
          const element = document.createElement("button");
          element.type = "button";
          element.className = "hunt-pin";
          element.setAttribute("aria-label", `${hunt.species} — ${hunt.location.farmName || hunt.location.placeName}`);
          element.addEventListener("click", () => navigate(`/people/${hunt.ownerId}/hunts/${hunt.id}`));
          new maplibregl.Marker({ element })
            .setLngLat([hunt.location.longitude, hunt.location.latitude])
            .addTo(map);
        }
        map.fitBounds(bounds, { padding: 56, maxZoom: 10 });
      } catch {
        if (!disposed) setError("Map could not be loaded.");
      }
    }
    void mount();
    return () => {
      disposed = true;
      cleanup?.();
    };
  }, [hunts, navigate]);

  if (hunts.length === 0) return <p className="ig-empty">No published hunts to map yet.</p>;
  return <div className="ppf-map">{error ? <p role="alert">{error}</p> : <div ref={container} />}</div>;
}
