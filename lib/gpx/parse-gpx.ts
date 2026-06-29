import { haversineKm } from "./haversine";
import type { ParsedGpx, TrackPoint } from "./types";

export type GpxErrorCode = "INVALID_XML" | "NO_TRACK_POINTS";

export class GpxParseError extends Error {
  constructor(
    public readonly code: GpxErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "GpxParseError";
  }
}

function parseDocument(rawGpx: string): Document {
  try {
    const document = new DOMParser().parseFromString(rawGpx, "application/xml");
    const hasParserError =
      document.documentElement.localName === "parsererror" ||
      document.querySelector("parsererror") !== null;

    if (hasParserError) {
      throw new GpxParseError("INVALID_XML", "The GPX file is not valid XML.");
    }

    return document;
  } catch (error) {
    if (error instanceof GpxParseError) {
      throw error;
    }

    throw new GpxParseError("INVALID_XML", "The GPX file is not valid XML.");
  }
}

function optionalNumber(value: string | null): number | null {
  if (value === null || value.trim() === "") {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function parsePoint(element: Element): TrackPoint | null {
  const latitude = optionalNumber(element.getAttribute("lat"));
  const longitude = optionalNumber(element.getAttribute("lon"));

  if (
    latitude === null ||
    longitude === null ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180
  ) {
    return null;
  }

  const elevation = optionalNumber(element.querySelector("ele")?.textContent ?? null);
  const timeText = element.querySelector("time")?.textContent?.trim() ?? null;
  const timestamp = timeText ? Date.parse(timeText) : Number.NaN;

  return {
    latitude,
    longitude,
    elevation,
    time: Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : null,
  };
}

export function parseGpx(rawGpx: string): ParsedGpx {
  const document = parseDocument(rawGpx);
  const points = Array.from(document.querySelectorAll("trkpt, rtept"))
    .map(parsePoint)
    .filter((point): point is TrackPoint => point !== null);

  if (points.length === 0) {
    throw new GpxParseError(
      "NO_TRACK_POINTS",
      "The GPX file does not contain valid track points.",
    );
  }

  let distanceKm = 0;
  for (let index = 1; index < points.length; index += 1) {
    distanceKm += haversineKm(points[index - 1], points[index]);
  }

  const timestamps = points
    .flatMap((point) => (point.time ? [Date.parse(point.time)] : []))
    .sort((left, right) => left - right);
  const durationMin =
    timestamps.length >= 2
      ? (timestamps.at(-1)! - timestamps[0]) / 60_000
      : null;

  return {
    rawGpx,
    points,
    distanceKm,
    durationMin,
    bounds: {
      south: Math.min(...points.map((point) => point.latitude)),
      west: Math.min(...points.map((point) => point.longitude)),
      north: Math.max(...points.map((point) => point.latitude)),
      east: Math.max(...points.map((point) => point.longitude)),
    },
  };
}

export async function hashGpx(rawGpx: string): Promise<string> {
  const bytes = new TextEncoder().encode(rawGpx);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}
