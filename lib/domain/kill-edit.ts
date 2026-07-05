import {
  type Kill,
  type KillLocation,
  type MediaAsset,
  type Measurement,
  type RouteMetadata,
  type Weapon,
  killSchema,
} from "./kill";

export type KillEdit = Partial<{
  species: string;
  coverMediaId: string | null;
  media: MediaAsset[];
  country: string;
  date: string;
  killTime: string;
  location: KillLocation;
  weapon: Weapon;
  ammunition: Kill["ammunition"];
  loadoutId: string;
  equipmentAttachments: NonNullable<Kill["equipmentAttachments"]>;
  measurement: Measurement;
  route: RouteMetadata | null;
  description: string;
  status: Kill["status"];
  isPublic: boolean;
  trashedAt: string | null;
}>;

const editableKeys = [
  "species",
  "coverMediaId",
  "media",
  "country",
  "date",
  "killTime",
  "location",
  "weapon",
  "ammunition",
  "loadoutId",
  "equipmentAttachments",
  "measurement",
  "route",
  "description",
  "status",
  "isPublic",
  "trashedAt",
] as const satisfies ReadonlyArray<keyof KillEdit>;

export function applyKillEdit(
  existing: Kill,
  edit: KillEdit,
  updatedAt = new Date().toISOString(),
): Kill {
  const allowedChanges: KillEdit = {};

  for (const key of editableKeys) {
    if (edit[key] !== undefined) {
      Object.assign(allowedChanges, { [key]: edit[key] });
    }
  }

  return killSchema.parse({
    ...existing,
    ...allowedChanges,
    id: existing.id,
    ownerId: existing.ownerId,
    createdAt: existing.createdAt,
    updatedAt,
  });
}
