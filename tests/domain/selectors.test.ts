import {
  getPortfolioStats,
  groupKillsByLocation,
  sortActiveKills,
} from "@/lib/domain/selectors";
import { makeKill } from "@/tests/helpers/kill";

describe("portfolio selectors", () => {
  it("orders active kills by date and exact kill time descending", () => {
    const early = makeKill({ id: "early", killTime: "06:20" });
    const late = makeKill({ id: "late", killTime: "18:45" });
    const older = makeKill({
      id: "older",
      date: "2024-10-05",
      killTime: "12:00",
    });
    const trashed = makeKill({
      id: "trashed",
      status: "trashed",
      trashedAt: "2025-06-13T00:00:00.000Z",
    });
    const draft = makeKill({
      id: "draft",
      status: "draft",
      coverMediaId: null,
      media: [],
    });

    expect(
      sortActiveKills([early, trashed, older, draft, late]).map(
        (kill) => kill.id,
      ),
    ).toEqual(["late", "early", "older"]);
  });

  it("groups active kills by country, place, and derived year", () => {
    const cape2025 = makeKill({ id: "cape-2025" });
    const cape2024 = makeKill({ id: "cape-2024", date: "2024-05-01" });
    const montana = makeKill({
      id: "montana",
      country: "United States",
      date: "2024-10-05",
      location: {
        latitude: 46.1,
        longitude: -114.2,
        placeName: "Bitterroot, Montana",
      },
    });

    const grouped = groupKillsByLocation([cape2024, montana, cape2025]);

    expect(grouped["South Africa"]["Eastern Cape"]["2025"]).toEqual([
      cape2025,
    ]);
    expect(grouped["South Africa"]["Eastern Cape"]["2024"]).toEqual([
      cape2024,
    ]);
    expect(
      grouped["United States"]["Bitterroot, Montana"]["2024"],
    ).toEqual([montana]);
  });

  it("derives active kill, country, and walked-distance totals", () => {
    const cape = makeKill();
    const montana = makeKill({
      id: "montana",
      country: "United States",
      route: null,
    });
    const trashed = makeKill({
      id: "trashed",
      status: "trashed",
      trashedAt: "2025-06-13T00:00:00.000Z",
    });

    expect(getPortfolioStats([cape, montana, trashed])).toEqual({
      animals: 2,
      countries: 2,
      distanceKm: 8.4,
    });
  });

  it("does not mutate the source array while sorting", () => {
    const first = makeKill({ id: "first", date: "2023-01-01" });
    const second = makeKill({ id: "second", date: "2025-01-01" });
    const source = [first, second];

    sortActiveKills(source);

    expect(source).toEqual([first, second]);
  });
});
