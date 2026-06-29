import type { RouteBounds } from "@/lib/domain/kill";

export interface TrackPoint {
  latitude: number;
  longitude: number;
  elevation: number | null;
  time: string | null;
}

export interface ParsedGpx {
  rawGpx: string;
  points: TrackPoint[];
  distanceKm: number;
  durationMin: number | null;
  bounds: RouteBounds;
}
