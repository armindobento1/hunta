import type { Kill } from "@/lib/domain/kill";

export function makeKill(overrides: Partial<Kill> = {}): Kill {
  return {
    id: "kill-1",
    ownerId: "owner-1",
    species: "Greater Kudu",
    coverMediaId: "media-1",
    media: [
      {
        id: "media-1",
        kind: "photo",
        storagePath: "users/owner-1/kills/kill-1/media/media-1-kudu.jpg",
        downloadUrl: "https://example.com/kudu.jpg",
        fileName: "kudu.jpg",
        contentType: "image/jpeg",
        sizeBytes: 2048,
        createdAt: "2025-06-12T04:40:00.000Z",
      },
    ],
    country: "South Africa",
    date: "2025-06-12",
    killTime: "06:42",
    location: {
      latitude: -33.0183,
      longitude: 27.9035,
      placeName: "Eastern Cape",
    },
    weapon: {
      type: "rifle",
      model: "Sako S20",
      caliber: ".300 Win Mag",
    },
    ammunition: {
      grain: 180,
      brand: "Norma",
      detail: "Bondstrike",
    },
    route: {
      storagePath: "users/owner-1/kills/kill-1/routes/route-1.gpx",
      fileName: "morning-stalk.gpx",
      distanceKm: 8.4,
      durationMin: 138,
      bounds: {
        south: -33.1,
        west: 27.8,
        north: -32.9,
        east: 28,
      },
      sourceHash: "sha256-source",
    },
    description: "A cold morning stalk through the valley.",
    status: "active",
    createdAt: "2025-06-12T04:40:00.000Z",
    updatedAt: "2025-06-12T08:00:00.000Z",
    trashedAt: null,
    ...overrides,
  };
}
