import { loadoutSchema, resolveLoadout } from "@/lib/domain/armory";

const now = "2026-06-30T12:00:00.000Z";
const weapon = {
  id: "weapon-1", ownerId: "owner-1", kind: "weapon" as const,
  name: "Sako S20", weapon: { type: "rifle" as const, model: "Sako S20", caliber: ".300 Win Mag" },
  createdAt: now, updatedAt: now,
};
const optic = {
  id: "optic-1", ownerId: "owner-1", kind: "optic" as const,
  name: "Zeiss V6", detail: "2.5-15x56", createdAt: now, updatedAt: now,
};
const ammunition = {
  id: "ammo-1", ownerId: "owner-1", kind: "ammunition" as const,
  name: "Norma Bondstrike", grain: 180, detail: "Bondstrike", createdAt: now, updatedAt: now,
};
const loadout = {
  id: "loadout-1", ownerId: "owner-1", name: "Plains Game", weaponId: weapon.id,
  slots: { opticId: optic.id, ammunitionId: ammunition.id }, isDefault: true,
  createdAt: now, updatedAt: now,
};

describe("armory domain", () => {
  it("accepts a weapon-first loadout and resolves typed equipment facts", () => {
    expect(loadoutSchema.parse(loadout).weaponId).toBe("weapon-1");
    expect(resolveLoadout(loadout, [weapon, optic, ammunition])).toMatchObject({
      weapon: weapon.weapon,
      ammunition: { grain: 180, brand: "Norma Bondstrike", detail: "Bondstrike" },
      attachments: { optic: { name: "Zeiss V6", detail: "2.5-15x56" } },
    });
  });

  it("rejects an item placed in the wrong attachment slot", () => {
    expect(() => resolveLoadout({ ...loadout, slots: { opticId: ammunition.id } }, [weapon, ammunition])).toThrow(/optic/i);
  });
});
