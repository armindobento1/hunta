import noTimes from "@/tests/fixtures/no-times.gpx?raw";
import validRoute from "@/tests/fixtures/valid-route.gpx?raw";

import { GpxParseError, parseGpx } from "@/lib/gpx/parse-gpx";
import { haversineKm } from "@/lib/gpx/haversine";

describe("parseGpx", () => {
  it("preserves source text and derives ordered points", () => {
    const result = parseGpx(validRoute);

    expect(result.rawGpx).toBe(validRoute);
    expect(result.segments).toHaveLength(1);
    expect(result.points).toHaveLength(2);
    expect(result.points[0]).toMatchObject({
      latitude: 0,
      longitude: 0,
      elevation: 100,
    });
    expect(result.points[1].longitude).toBe(0.01);
  });

  it("excludes the gap between track segments from distance", () => {
    const raw = `<gpx><trk>
      <trkseg><trkpt lat="0" lon="0"/><trkpt lat="0" lon="0.01"/></trkseg>
      <trkseg><trkpt lat="10" lon="10"/><trkpt lat="10" lon="10.01"/></trkseg>
    </trk></gpx>`;
    const result = parseGpx(raw);
    const expected =
      haversineKm(result.segments[0][0], result.segments[0][1]) +
      haversineKm(result.segments[1][0], result.segments[1][1]);

    expect(result.segments).toHaveLength(2);
    expect(result.points).toEqual(result.segments.flat());
    expect(result.distanceKm).toBeCloseTo(expected, 10);
    expect(result.distanceKm).toBeLessThan(3);
  });

  it("treats a route as one segment and exposes its flat points", () => {
    const raw = `<gpx><rte>
      <rtept lat="-33" lon="27.9"/><rtept lat="-33.01" lon="27.91"/>
    </rte></gpx>`;
    const result = parseGpx(raw);

    expect(result.segments).toHaveLength(1);
    expect(result.segments[0]).toHaveLength(2);
    expect(result.points).toEqual(result.segments[0]);
    expect(result.distanceKm).toBeGreaterThan(0);
  });

  it("accepts direct track points when a track has no segment wrapper", () => {
    const raw = `<gpx><trk>
      <trkpt lat="-33" lon="27.9"/><trkpt lat="-33.01" lon="27.91"/>
    </trk></gpx>`;

    expect(parseGpx(raw).segments[0]).toHaveLength(2);
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
