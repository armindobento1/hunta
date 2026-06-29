import type { Kill } from "./kill";

export type LocationGroups = Record<
  string,
  Record<string, Record<string, Kill[]>>
>;

export interface PortfolioStats {
  animals: number;
  countries: number;
  distanceKm: number;
}

function chronologicalKey(kill: Kill): string {
  return `${kill.date}T${kill.killTime}`;
}

export function sortActiveKills(kills: readonly Kill[]): Kill[] {
  return kills
    .filter((kill) => kill.status === "active")
    .sort((left, right) => {
      const byKillTime = chronologicalKey(right).localeCompare(
        chronologicalKey(left),
      );

      return byKillTime || right.createdAt.localeCompare(left.createdAt);
    });
}

export function groupKillsByLocation(kills: readonly Kill[]): LocationGroups {
  const groups: LocationGroups = {};

  for (const kill of sortActiveKills(kills)) {
    const year = kill.date.slice(0, 4);
    groups[kill.country] ??= {};
    groups[kill.country][kill.location.placeName] ??= {};
    groups[kill.country][kill.location.placeName][year] ??= [];
    groups[kill.country][kill.location.placeName][year].push(kill);
  }

  return groups;
}

export function getPortfolioStats(kills: readonly Kill[]): PortfolioStats {
  const active = sortActiveKills(kills);
  const distanceKm = active.reduce(
    (total, kill) => total + (kill.route?.distanceKm ?? 0),
    0,
  );

  return {
    animals: active.length,
    countries: new Set(active.map((kill) => kill.country)).size,
    distanceKm: Math.round(distanceKm * 100) / 100,
  };
}
