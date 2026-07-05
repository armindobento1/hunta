import { z } from "zod";

import { ammunitionSchema, equipmentAttachmentsSchema, killLocationSchema, measurementSchema, weaponSchema, type Kill } from "./kill";
import type { Profile } from "./profile";

const publicMediaSchema = z.object({ id: z.string().min(1), kind: z.enum(["photo", "video"]), downloadUrl: z.string().url() }).strict();
const hunterSchema = z.object({ id: z.string().min(1), displayName: z.string().trim().min(1).max(80), avatarUrl: z.string().url().nullable() }).strict();

export const publicProfileSchema = z.object({
  id: z.string().min(1), displayName: z.string().trim().min(1).max(80), avatarUrl: z.string().url().nullable(),
  bio: z.string().trim().max(280), searchName: z.string().min(1).max(100), createdAt: z.string().datetime(), updatedAt: z.string().datetime(),
}).strict();

export const publicHuntSchema = z.object({
  id: z.string().min(1), ownerId: z.string().min(1), sourceKillId: z.string().min(1), hunter: hunterSchema,
  species: z.string().trim().min(1).max(120), coverMediaId: z.string().min(1).nullable(), media: z.array(publicMediaSchema).max(30),
  country: z.string().trim().min(1).max(100), date: z.string(), killTime: z.string(), location: killLocationSchema,
  weapon: weaponSchema, ammunition: ammunitionSchema, equipmentAttachments: equipmentAttachmentsSchema.optional(),
  measurement: measurementSchema.optional(), routeSummary: z.object({ distanceKm: z.number().nonnegative(), durationMin: z.number().nonnegative().nullable() }).strict().nullable(),
  description: z.string().max(5000), publishedAt: z.string().datetime(), updatedAt: z.string().datetime(),
}).strict();

export type PublicProfile = z.infer<typeof publicProfileSchema>;
export type PublicHunt = z.infer<typeof publicHuntSchema>;

export function normalizeSearchName(value: string): string {
  return value.trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, " ").toLowerCase();
}

export function buildPublicProfile(profile: Profile): PublicProfile {
  return publicProfileSchema.parse({ ...profile, displayName: profile.displayName.trim(), searchName: normalizeSearchName(profile.displayName) });
}

export function buildPublicHunt(kill: Kill, profile: Profile, publishedAt = new Date().toISOString()): PublicHunt {
  return publicHuntSchema.parse({
    id: `${kill.ownerId}_${kill.id}`, ownerId: kill.ownerId, sourceKillId: kill.id,
    hunter: { id: profile.id, displayName: profile.displayName.trim(), avatarUrl: profile.avatarUrl },
    species: kill.species, coverMediaId: kill.coverMediaId,
    media: kill.media.map(({ id, kind, downloadUrl }) => ({ id, kind, downloadUrl })),
    country: kill.country, date: kill.date, killTime: kill.killTime, location: kill.location,
    weapon: kill.weapon, ammunition: kill.ammunition,
    ...(kill.equipmentAttachments ? { equipmentAttachments: kill.equipmentAttachments } : {}),
    ...(kill.measurement ? { measurement: kill.measurement } : {}),
    routeSummary: kill.route ? { distanceKm: kill.route.distanceKm, durationMin: kill.route.durationMin } : null,
    description: kill.description, publishedAt, updatedAt: kill.updatedAt,
  });
}

export function rankPublicHunts(hunts: readonly PublicHunt[], species: string): PublicHunt[] {
  return hunts.filter((hunt) => hunt.species === species && typeof hunt.measurement?.score === "number").sort((a, b) => (b.measurement?.score ?? 0) - (a.measurement?.score ?? 0));
}
