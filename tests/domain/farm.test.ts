import { buildFarm, distanceKm, farmIdFor, farmSchema, nearbyFarms, type Farm } from "@/lib/domain/farm";

const input = {
  name: "Baviaans Lodge",
  latitude: -33.0183,
  longitude: 27.9035,
  country: "South Africa",
  placeName: "Eastern Cape",
};

function makeFarm(overrides: Partial<Farm> = {}): Farm {
  return farmSchema.parse({ ...buildFarm(input, "owner-1", "2025-06-12T08:00:00.000Z"), ...overrides });
}

describe("farm domain", () => {
  it("builds a valid farm entry from published hunt facts", () => {
    const farm = buildFarm(input, "owner-1", "2025-06-12T08:00:00.000Z");
    expect(farm).toMatchObject({
      name: "Baviaans Lodge",
      searchName: "baviaans lodge",
      country: "South Africa",
      createdBy: "owner-1",
    });
    expect(farm.id).toBe("baviaans-lodge_-33.02_27.90");
  });

  it("maps the same farm name near the same spot to one deterministic id", () => {
    expect(farmIdFor("Baviaans Lodge", -33.0183, 27.9035)).toBe(
      farmIdFor("  baviaans LODGE ", -33.0201, 27.9012),
    );
  });

  it("keeps distinct farms with the same name apart by location", () => {
    expect(farmIdFor("Springbok Farm", -33.02, 27.9)).not.toBe(
      farmIdFor("Springbok Farm", -25.75, 28.19),
    );
  });

  it("rejects a farm without a name", () => {
    expect(() => buildFarm({ ...input, name: "  " }, "owner-1")).toThrow();
  });

  it("measures real-world distance", () => {
    // East London to Gqeberha is roughly 250 km.
    const km = distanceKm(-33.0153, 27.9116, -33.9608, 25.6022);
    expect(km).toBeGreaterThan(230);
    expect(km).toBeLessThan(260);
  });

  it("suggests only farms within the radius, closest first", () => {
    const close = makeFarm();
    const nearby = makeFarm({ id: "other", name: "Karreekloof", latitude: -33.05, longitude: 27.95 });
    const far = makeFarm({ id: "far", name: "Limpopo Plains", latitude: -23.9, longitude: 29.45 });

    const suggestions = nearbyFarms([far, nearby, close], -33.0183, 27.9035);

    expect(suggestions.map((entry) => entry.farm.id)).toEqual([close.id, "other"]);
    expect(suggestions[0].distanceKm).toBeLessThan(suggestions[1].distanceKm);
  });
});
