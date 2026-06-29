import { applyKillEdit } from "@/lib/domain/kill-edit";
import { makeKill } from "@/tests/helpers/kill";

describe("applyKillEdit", () => {
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
