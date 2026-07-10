import type { ArmoryItem } from "@/lib/domain/armory";

export function armoryItemSpec(item: ArmoryItem): string {
  if (item.kind === "weapon") return item.weapon.type === "rifle" ? item.weapon.caliber : item.weapon.bowType;
  if (item.kind === "ammunition" || item.kind === "broadhead") return `${item.grain}gr${item.detail ? ` · ${item.detail}` : ""}`;
  return item.detail ?? "";
}
