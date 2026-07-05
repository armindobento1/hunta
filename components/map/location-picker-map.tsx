"use client";

import { useEffect, useRef, useState } from "react";
import type { Map as MapLibreMap, Marker } from "maplibre-gl";

const DEFAULT_TILE_URL =
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
const PIN_COLOR = "#f6c267";
const WORLD_CENTER: [number, number] = [17, 10];
const PICK_ZOOM = 14;

export function LocationPickerMap({
  latitude,
  longitude,
  onPick,
}: {
  latitude: number;
  longitude: number;
  onPick(latitude: number, longitude: number): void;
}) {
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markerRef = useRef<Marker | null>(null);
  const maplibreRef = useRef<typeof import("maplibre-gl") | null>(null);
  const onPickRef = useRef(onPick);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    onPickRef.current = onPick;
  }, [onPick]);

  useEffect(() => {
    if (!container.current) return;
    let disposed = false;

    async function mount() {
      try {
        const { default: maplibregl } = await import("maplibre-gl");
        if (disposed || !container.current) return;
        maplibreRef.current = maplibregl;
        const hasPoint = Number.isFinite(latitude) && Number.isFinite(longitude);
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
          center: hasPoint ? [longitude, latitude] : WORLD_CENTER,
          zoom: hasPoint ? PICK_ZOOM : 1.4,
        });
        map.on("click", (event) => {
          onPickRef.current(event.lngLat.lat, event.lngLat.lng);
        });
        if (hasPoint) {
          markerRef.current = new maplibregl.Marker({ color: PIN_COLOR })
            .setLngLat([longitude, latitude])
            .addTo(map);
        }
        mapRef.current = map;
      } catch {
        if (!disposed) setError("Satellite map is temporarily unavailable.");
      }
    }

    mount();
    return () => {
      disposed = true;
      mapRef.current?.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // Mount once; coordinate changes are handled by the effect below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const maplibregl = maplibreRef.current;
    if (!map || !maplibregl) return;
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return;
    if (markerRef.current) {
      markerRef.current.setLngLat([longitude, latitude]);
    } else {
      markerRef.current = new maplibregl.Marker({ color: PIN_COLOR })
        .setLngLat([longitude, latitude])
        .addTo(map);
    }
    // Recenter only when the point arrives from outside the visible map
    // (search jump, current position, manual coordinates) — never on a tap
    // inside the view, which would yank the map out from under the user.
    if (!map.getBounds().contains([longitude, latitude])) {
      map.easeTo({ center: [longitude, latitude], zoom: Math.max(map.getZoom(), PICK_ZOOM) });
    }
  }, [latitude, longitude]);

  if (error) {
    return <div className="map-fallback location-picker-fallback">{error}</div>;
  }

  return (
    <div
      className="location-picker-map"
      ref={container}
      role="application"
      aria-label="Satellite map — tap to drop the kill location pin"
    />
  );
}
