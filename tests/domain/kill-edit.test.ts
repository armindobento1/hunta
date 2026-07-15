import { applyKillEdit } from "@/lib/domain/kill-edit";
import { makeKill } from "@/tests/helpers/kill";

describe("applyKillEdit", () => {
  it("updates optional trophy measurements without changing core ownership facts", () => {
    const existing = makeKill();
    const updated = applyKillEdit(existing, {
      measurement: {
        score: 54.125,
        scoreUnit: "in",
        scoringSystem: "SCI",
      },
    });

    expect(updated.measurement?.score).toBe(54.125);
    expect(updated.id).toBe(existing.id);
    expect(updated.ownerId).toBe(existing.ownerId);
    expect(updated.location).toEqual(existing.location);
  });

  it("preserves core facts and attachments when they are omitted", () => {
    const existing = makeKill();
    const updated = applyKillEdit(
      existing,
      { description: "Updated story" },
      "2025-06-13T08:00:00.000Z",
    );

    expect(updated.description).toBe("Updated story");
    expect(updated.media).toEqual(existing.media);
    expect(updated.route).toEqual(existing.route);
    expect(updated.location).toEqual(existing.location);
    expect(updated.weapon).toEqual(existing.weapon);
    expect(updated.ownerId).toBe(existing.ownerId);
    expect(updated.updatedAt).toBe("2025-06-13T08:00:00.000Z");
  });

  it("allows an explicit route removal without changing media", () => {
    const existing = makeKill();
    const updated = applyKillEdit(existing, { route: null });

    expect(updated.route).toBeNull();
    expect(updated.media).toEqual(existing.media);
  });

  it("removes optional-absent facts when they are explicitly cleared", () => {
    const existing = makeKill({
      loadoutId: "loadout-1",
      equipmentAttachments: {
        optic: { name: "Swarovski Z8i" },
      },
      measurement: { score: 54.125, scoreUnit: "in" },
    });
    const updated = applyKillEdit(existing, {
      loadoutId: null,
      equipmentAttachments: null,
      measurement: null,
    });

    expect(updated).not.toHaveProperty("loadoutId");
    expect(updated).not.toHaveProperty("equipmentAttachments");
    expect(updated).not.toHaveProperty("measurement");
  });

  it("leaves optional-absent facts unchanged when edits are undefined", () => {
    const existing = makeKill({
      loadoutId: "loadout-1",
      equipmentAttachments: {
        arrow: { name: "Easton Axis" },
        broadhead: { name: "QAD Exodus" },
      },
      measurement: { weightDressed: 241, weightUnit: "kg" },
    });
    const updated = applyKillEdit(existing, {
      loadoutId: undefined,
      equipmentAttachments: undefined,
      measurement: undefined,
    });

    expect(updated.loadoutId).toBe(existing.loadoutId);
    expect(updated.equipmentAttachments).toEqual(
      existing.equipmentAttachments,
    );
    expect(updated.measurement).toEqual(existing.measurement);
  });

  it("does not permit ownership or identity fields in an edit", () => {
    const existing = makeKill();
    const hostile = {
      ownerId: "attacker",
      id: "replacement",
      description: "Safe update",
    } as unknown as Parameters<typeof applyKillEdit>[1];
    const updated = applyKillEdit(existing, hostile);

    expect(updated.ownerId).toBe("owner-1");
    expect(updated.id).toBe("kill-1");
  });
});
