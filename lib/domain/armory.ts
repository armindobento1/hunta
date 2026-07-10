import { z } from "zod";

import { weaponSchema, type Ammunition, type Weapon } from "./kill";

const base = {
  id: z.string().min(1), ownerId: z.string().min(1), name: z.string().trim().min(1).max(120),
  createdAt: z.string().datetime(), updatedAt: z.string().datetime(),
};
const detail = z.string().trim().max(160).optional();
const grain = z.number().positive().max(2000);
const simpleItem = (kind: "optic" | "suppressor" | "bipod" | "sling" | "arrow") => z.object({ ...base, kind: z.literal(kind), detail }).strict();
const grainItem = (kind: "ammunition" | "broadhead") => z.object({ ...base, kind: z.literal(kind), grain, detail }).strict();

export const armoryItemSchema = z.discriminatedUnion("kind", [
  z.object({ ...base, kind: z.literal("weapon"), weapon: weaponSchema }).strict(),
  simpleItem("optic"), simpleItem("suppressor"), simpleItem("bipod"), simpleItem("sling"), simpleItem("arrow"),
  grainItem("ammunition"), grainItem("broadhead"),
]);
export const loadoutSchema = z.object({
  ...base,
  weaponId: z.string().min(1),
  slots: z.object({
    opticId: z.string().min(1).optional(), suppressorId: z.string().min(1).optional(),
    bipodId: z.string().min(1).optional(), slingId: z.string().min(1).optional(),
    ammunitionId: z.string().min(1).optional(), arrowId: z.string().min(1).optional(),
    broadheadId: z.string().min(1).optional(),
  }).strict(),
  isDefault: z.boolean(),
}).strict();

export type ArmoryItem = z.infer<typeof armoryItemSchema>;
export type Loadout = z.infer<typeof loadoutSchema>;
export type LoadoutSlotKey = keyof Loadout["slots"];
export type AttachmentKind = "optic" | "suppressor" | "bipod" | "sling" | "arrow" | "broadhead";
export type AttachmentSnapshot = { name: string; grain?: number; detail?: string };
export type ResolvedLoadout = {
  weapon: Weapon;
  ammunition?: Ammunition;
  attachments: Partial<Record<AttachmentKind, AttachmentSnapshot>>;
};

// Schematic slots drive the loadout builder: each slot carries the only armory
// item kind it accepts plus a plus-button anchor (percentage coordinates on
// the weapon illustration). Slots absent from a weapon's schematic are invalid
// for that weapon type.
export type SchematicSlot = {
  slot: LoadoutSlotKey; kind: AttachmentKind | "ammunition"; label: string;
  anchor: { x: number; y: number };
};
export const rifleSchematic: readonly SchematicSlot[] = [
  { slot: "opticId", kind: "optic", label: "Optic", anchor: { x: 44, y: 18 } },
  { slot: "suppressorId", kind: "suppressor", label: "Muzzle", anchor: { x: 93, y: 42 } },
  { slot: "ammunitionId", kind: "ammunition", label: "Ammunition", anchor: { x: 36, y: 58 } },
  { slot: "bipodId", kind: "bipod", label: "Bipod", anchor: { x: 70, y: 82 } },
  { slot: "slingId", kind: "sling", label: "Sling", anchor: { x: 16, y: 72 } },
];
export const bowSchematic: readonly SchematicSlot[] = [
  { slot: "opticId", kind: "optic", label: "Sight", anchor: { x: 42, y: 38 } },
  { slot: "arrowId", kind: "arrow", label: "Arrow", anchor: { x: 62, y: 50 } },
  { slot: "broadheadId", kind: "broadhead", label: "Broadhead", anchor: { x: 88, y: 50 } },
  { slot: "slingId", kind: "sling", label: "Sling", anchor: { x: 30, y: 80 } },
];
export function getLoadoutSchematic(weaponType: Weapon["type"]): readonly SchematicSlot[] {
  return weaponType === "rifle" ? rifleSchematic : bowSchematic;
}

export function resolveLoadout(input: Loadout, inputItems: ArmoryItem[]): ResolvedLoadout {
  const loadout = loadoutSchema.parse(input);
  const items = inputItems.map((item) => armoryItemSchema.parse(item));
  const get = (id: string, kind: ArmoryItem["kind"]) => {
    const item = items.find((candidate) => candidate.id === id && candidate.ownerId === loadout.ownerId);
    if (!item || item.kind !== kind) throw new Error(`Loadout ${kind} slot is incomplete.`);
    return item;
  };
  const weaponItem = get(loadout.weaponId, "weapon");
  if (weaponItem.kind !== "weapon") throw new Error("Loadout weapon is incomplete.");
  const schematic = getLoadoutSchematic(weaponItem.weapon.type);
  const allowedSlots = new Set(schematic.map((entry) => entry.slot));
  for (const key of Object.keys(loadout.slots) as LoadoutSlotKey[]) {
    if (loadout.slots[key] && !allowedSlots.has(key)) {
      throw new Error(`A ${weaponItem.weapon.type} loadout cannot fill the ${key.replace(/Id$/, "")} slot.`);
    }
  }
  let ammunition: Ammunition | undefined;
  const attachments: ResolvedLoadout["attachments"] = {};
  for (const entry of schematic) {
    const id = loadout.slots[entry.slot];
    if (!id) continue;
    const item = get(id, entry.kind);
    if (item.kind === "weapon") throw new Error(`Loadout ${entry.kind} slot is incomplete.`);
    if (item.kind === "ammunition") {
      ammunition = { grain: item.grain, brand: item.name, ...(item.detail ? { detail: item.detail } : {}) };
      continue;
    }
    attachments[item.kind] = {
      name: item.name,
      ...(item.kind === "broadhead" ? { grain: item.grain } : {}),
      ...(item.detail ? { detail: item.detail } : {}),
    };
  }
  return { weapon: weaponItem.weapon, ...(ammunition ? { ammunition } : {}), attachments };
}
