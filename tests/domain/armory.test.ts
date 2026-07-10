import { getLoadoutSchematic, loadoutSchema, resolveLoadout } from "@/lib/domain/armory";

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
const bow = {
  id: "weapon-2", ownerId: "owner-1", kind: "weapon" as const,
  name: "Hoyt RX-7", weapon: { type: "bow" as const, model: "Hoyt RX-7", bowType: "Compound" },
  createdAt: now, updatedAt: now,
};
const arrow = {
  id: "arrow-1", ownerId: "owner-1", kind: "arrow" as const,
  name: "Easton Axis", detail: "300 spine", createdAt: now, updatedAt: now,
};
const broadhead = {
  id: "broadhead-1", ownerId: "owner-1", kind: "broadhead" as const,
  name: "QAD Exodus", grain: 100, createdAt: now, updatedAt: now,
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

  it("resolves a bow loadout with arrow and broadhead slots", () => {
    const bowLoadout = { ...loadout, id: "loadout-2", weaponId: bow.id, slots: { arrowId: arrow.id, broadheadId: broadhead.id } };
    expect(resolveLoadout(bowLoadout, [bow, arrow, broadhead])).toMatchObject({
      weapon: bow.weapon,
      attachments: {
        arrow: { name: "Easton Axis", detail: "300 spine" },
        broadhead: { name: "QAD Exodus", grain: 100 },
      },
    });
  });

  it("rejects slots that do not belong to the weapon type", () => {
    expect(() => resolveLoadout({ ...loadout, weaponId: bow.id, slots: { ammunitionId: ammunition.id } }, [bow, ammunition])).toThrow(/bow loadout/i);
    expect(() => resolveLoadout({ ...loadout, slots: { arrowId: arrow.id } }, [weapon, arrow])).toThrow(/rifle loadout/i);
  });

  it("exposes a schematic per weapon type for the loadout builder", () => {
    expect(getLoadoutSchematic("rifle").map((entry) => entry.kind)).toEqual(["optic", "suppressor", "ammunition", "bipod", "sling"]);
    expect(getLoadoutSchematic("bow").map((entry) => entry.kind)).toEqual(["optic", "arrow", "broadhead", "sling"]);
    for (const entry of [...getLoadoutSchematic("rifle"), ...getLoadoutSchematic("bow")]) {
      expect(entry.anchor.x).toBeGreaterThanOrEqual(0);
      expect(entry.anchor.x).toBeLessThanOrEqual(100);
      expect(entry.anchor.y).toBeGreaterThanOrEqual(0);
      expect(entry.anchor.y).toBeLessThanOrEqual(100);
    }
  });
});
