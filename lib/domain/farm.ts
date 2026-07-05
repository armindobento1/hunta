import { z } from "zod";

import { normalizeSearchName } from "./public-social";

const trimmed = (max: number) => z.string().trim().min(1).max(max);

/**
 * A community farm entry. Farms are a deliberate public projection: a farm
 * document is only ever created at the moment a hunt there is published
 * publicly — private records never create or expose farms.
 */
export const farmSchema = z
  .object({
    id: z.string().min(1).max(240),
    name: trimmed(200),
    searchName: z.string().min(1).max(200),
    latitude: z.number().finite().min(-90).max(90),
    longitude: z.number().finite().min(-180).max(180),
    country: trimmed(100),
    placeName: trimmed(160),
    createdBy: z.string().min(1),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  })
  .strict();

export type Farm = z.infer<typeof farmSchema>;

/**
 * Deterministic id: same normalized name within ~1 km buckets maps to the
 * same document, so republishing or two hunts on the same farm never create
 * duplicates. Distinct farms sharing a name stay separate via coordinates.
 */
export function farmIdFor(name: string, latitude: number, longitude: number): string {
  const slug = normalizeSearchName(name).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return `${slug}_${latitude.toFixed(2)}_${longitude.toFixed(2)}`;
}

export interface FarmInput {
  name: string;
  latitude: number;
  longitude: number;
  country: string;
  placeName: string;
}

export function buildFarm(input: FarmInput, createdBy: string, now = new Date().toISOString()): Farm {
  const name = input.name.trim();
  if (!name) throw new Error("A farm entry needs a farm name.");
  return farmSchema.parse({
    id: farmIdFor(name, input.latitude, input.longitude),
    name,
    searchName: normalizeSearchName(name),
    latitude: input.latitude,
    longitude: input.longitude,
    country: input.country,
    placeName: input.placeName,
    createdBy,
    createdAt: now,
    updatedAt: now,
  });
}

const EARTH_RADIUS_KM = 6371;

export function distanceKm(
  fromLatitude: number,
  fromLongitude: number,
  toLatitude: number,
  toLongitude: number,
): number {
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const dLat = toRadians(toLatitude - fromLatitude);
  const dLng = toRadians(toLongitude - fromLongitude);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(fromLatitude)) * Math.cos(toRadians(toLatitude)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(a));
}

export interface FarmSuggestion {
  farm: Farm;
  distanceKm: number;
}

/** Nearby existing farms, closest first — the "did you hunt here?" prompt. */
export function nearbyFarms(
  farms: readonly Farm[],
  latitude: number,
  longitude: number,
  radiusKm = 15,
  max = 5,
): FarmSuggestion[] {
  return farms
    .map((farm) => ({ farm, distanceKm: distanceKm(latitude, longitude, farm.latitude, farm.longitude) }))
    .filter((entry) => entry.distanceKm <= radiusKm)
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, max);
}
