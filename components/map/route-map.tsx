"use client";

import { useEffect, useRef, useState } from "react";

import type { Kill } from "@/lib/domain/kill";
import { downloadGpx } from "@/lib/firebase/storage-repository";
import { parseGpx } from "@/lib/gpx/parse-gpx";

const DEFAULT_TILE_URL =
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";

export function RouteMap({ kill }: { kill: Kill }) {
  const container = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!kill.route || !container.current) return;
    let disposed = false;
    let cleanup: (() => void) | undefined;

    async function mount() {
      try {
        const [{ default: maplibregl }, rawGpx] = await Promise.all([
          import("maplibre-gl"),
          downloadGpx(kill.route!.storagePath),
        ]);
        if (disposed || !container.current) return;
        const parsed = parseGpx(rawGpx);
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
          center: [kill.location.longitude, kill.location.latitude],
          zoom: 11,
        });
        cleanup = () => map.remove();
        map.once("load", () => {
          if (disposed) return;
          map.addSource("route", {
            type: "geojson",
            data: {
              type: "Feature",
              properties: {},
              geometry: {
                type: "MultiLineString",
                coordinates: parsed.segments.map((segment) =>
                  segment.map((point) => [point.longitude, point.latitude]),
                ),
              },
            },
          });
          map.addLayer({
            id: "route-line",
            type: "line",
            source: "route",
            paint: {
              "line-color": "#f6c267",
              "line-width": 4,
              "line-opacity": 0.95,
            },
          });
          map.fitBounds(
            [
              [parsed.bounds.west, parsed.bounds.south],
              [parsed.bounds.east, parsed.bounds.north],
            ],
            { padding: 48, maxZoom: 15 },
          );
          new maplibregl.Marker({ color: "#f6c267" })
            .setLngLat([kill.location.longitude, kill.location.latitude])
            .addTo(map);
        });
      } catch {
        if (!disposed) setError("Satellite route map is temporarily unavailable.");
      }
    }

    mount();
    return () => {
      disposed = true;
      cleanup?.();
    };
  }, [kill]);

  if (error) {
    return <div className="map-fallback">{error}</div>;
  }

  return <div className="route-map" ref={container} aria-label="Satellite route map" />;
}
