import { buildPublicHunt, normalizeSearchName, rankPublicHunts } from "@/lib/domain/public-social";
import { makeKill } from "@/tests/helpers/kill";

const profile = { id: "owner-1", displayName: "  Marcus Halvorsen ", avatarUrl: null, bio: "Fair chase.", createdAt: "2025-01-01T00:00:00.000Z", updatedAt: "2025-01-01T00:00:00.000Z" };

describe("public social projections", () => {
  it("builds a deterministic public snapshot without private storage paths", () => {
    const projection = buildPublicHunt(makeKill({ location: { latitude: -33, longitude: 28, placeName: "Eastern Cape", farmName: "Baviaans Lodge" } }), profile, "2025-06-12T09:00:00.000Z");

    expect(projection.id).toBe("owner-1_kill-1");
    expect(projection.location).toMatchObject({ farmName: "Baviaans Lodge", latitude: -33, longitude: 28 });
    expect(projection.media[0]).toEqual({ id: "media-1", kind: "photo", downloadUrl: "https://example.com/kudu.jpg" });
    expect(JSON.stringify(projection)).not.toContain("storagePath");
    expect(JSON.stringify(projection)).not.toContain("trashedAt");
  });

  it("normalizes account names for prefix search", () => {
    expect(normalizeSearchName("  MárCus  Halvorsen ")).toBe("marcus halvorsen");
  });

  it("ranks only measured published hunts within a species", () => {
    const first = buildPublicHunt(makeKill({ id: "one", measurement: { score: 55, scoreUnit: "in" } }), profile);
    const second = buildPublicHunt(makeKill({ id: "two", measurement: { score: 59, scoreUnit: "in" } }), profile);
    expect(rankPublicHunts([first, second], "Greater Kudu").map((hunt) => hunt.sourceKillId)).toEqual(["two", "one"]);
  });
});
