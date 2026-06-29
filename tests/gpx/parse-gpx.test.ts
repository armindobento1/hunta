import noTimes from "@/tests/fixtures/no-times.gpx?raw";
import validRoute from "@/tests/fixtures/valid-route.gpx?raw";

import { GpxParseError, parseGpx } from "@/lib/gpx/parse-gpx";

describe("parseGpx", () => {
  it("preserves source text and derives ordered points", () => {
    const result = parseGpx(validRoute);

    expect(result.rawGpx).toBe(validRoute);
    expect(result.points).toHaveLength(2);
    expect(result.points[0]).toMatchObject({
      latitude: 0,
      longitude: 0,
      elevation: 100,
    });
    expect(result.points[1].longitude).toBe(0.01);
  });

  it("derives distance, duration, and bounds from the source points", () => {
    const result = parseGpx(validRoute);

    expect(result.distanceKm).toBeCloseTo(1.112, 2);
    expect(result.durationMin).toBe(10);
    expect(result.bounds).toEqual({
      south: 0,
      west: 0,
      north: 0,
      east: 0.01,
    });
  });

  it("keeps duration unavailable when timestamps are absent", () => {
    const result = parseGpx(noTimes);

    expect(result.distanceKm).toBeGreaterThan(0);
    expect(result.durationMin).toBeNull();
  });

  it("rejects malformed XML with a specific code", () => {
    expect(() => parseGpx("<gpx><trk>")).toThrowError(GpxParseError);

    try {
      parseGpx("<gpx><trk>");
    } catch (error) {
      expect(error).toMatchObject({ code: "INVALID_XML" });
    }
  });

  it("rejects a GPX document without track or route points", () => {
    expect(() => parseGpx("<gpx version=\"1.1\"></gpx>")).toThrowError(
      expect.objectContaining({ code: "NO_TRACK_POINTS" }),
    );
  });

  it("does not fabricate coordinates from invalid points", () => {
    const raw = `<gpx><trk><trkseg><trkpt lat="not-a-number" lon="27.9" /></trkseg></trk></gpx>`;

    expect(() => parseGpx(raw)).toThrowError(
      expect.objectContaining({ code: "NO_TRACK_POINTS" }),
    );
  });
});
