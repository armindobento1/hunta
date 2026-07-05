import { z } from "zod";

import { weaponSchema, type Ammunition, type Weapon } from "./kill";

const base = {
  id: z.string().min(1), ownerId: z.string().min(1), name: z.string().trim().min(1).max(120),
  createdAt: z.string().datetime(), updatedAt: z.string().datetime(),
};
const detail = z.string().trim().max(160).optional();
const simpleItem = (kind: "optic" | "suppressor" | "bipod" | "sling") => z.object({ ...base, kind: z.literal(kind), detail }).strict();

export const armoryItemSchema = z.discriminatedUnion("kind", [
  z.object({ ...base, kind: z.literal("weapon"), weapon: weaponSchema }).strict(),
  simpleItem("optic"), simpleItem("suppressor"), simpleItem("bipod"), simpleItem("sling"),
  z.object({ ...base, kind: z.literal("ammunition"), grain: z.number().positive().max(2000), detail }).strict(),
]);
export const loadoutSchema = z.object({
  ...base,
  weaponId: z.string().min(1),
  slots: z.object({
    opticId: z.string().min(1).optional(), suppressorId: z.string().min(1).optional(),
    bipodId: z.string().min(1).optional(), slingId: z.string().min(1).optional(),
    ammunitionId: z.string().min(1).optional(),
  }).strict(),
  isDefault: z.boolean(),
}).strict();

export type ArmoryItem = z.infer<typeof armoryItemSchema>;
export type Loadout = z.infer<typeof loadoutSchema>;
export type AttachmentSnapshot = { name: string; detail?: string };
export type ResolvedLoadout = {
  weapon: Weapon;
  ammunition?: Ammunition;
  attachments: Partial<Record<"optic" | "suppressor" | "bipod" | "sling", AttachmentSnapshot>>;
};

export function resolveLoadout(input: Loadout, inputItems: ArmoryItem[]): ResolvedLoadout {
  const loadout = loadoutSchema.parse(input);
  const items = inputItems.map((item) => armoryItemSchema.parse(item));
  const get = (id: string, kind: ArmoryItem["kind"]) => {
    const item = items.find((candidate) => candidate.id === id && candidate.ownerId === loadout.ownerId);
    if (!item || item.kind !== kind) throw new Error(`Loadout ${kind} slot is incomplete.`);
    return item;
  };
  const weapon = get(loadout.weaponId, "weapon");
  if (weapon.kind !== "weapon") throw new Error("Loadout weapon is incomplete.");
  const attachments: ResolvedLoadout["attachments"] = {};
  for (const kind of ["optic", "suppressor", "bipod", "sling"] as const) {
    const id = loadout.slots[`${kind}Id`];
    if (id) {
      const item = get(id, kind);
      if (item.kind !== kind) throw new Error(`Loadout ${kind} slot is incomplete.`);
      attachments[kind] = { name: item.name, ...(item.detail ? { detail: item.detail } : {}) };
    }
  }
  const ammoId = loadout.slots.ammunitionId;
  const ammo = ammoId ? get(ammoId, "ammunition") : undefined;
  return {
    weapon: weapon.weapon,
    ...(ammo?.kind === "ammunition" ? { ammunition: { grain: ammo.grain, brand: ammo.name, ...(ammo.detail ? { detail: ammo.detail } : {}) } } : {}),
    attachments,
  };
}
