"use client";

import { Route } from "lucide-react";
import { type ChangeEvent, useId, useState } from "react";

import { parseGpx } from "@/lib/gpx/parse-gpx";

export function GpxPicker({
  file,
  existingName,
  onChange,
}: {
  file: File | null;
  existingName?: string;
  onChange(file: File | null): void;
}) {
  const inputId = useId();
  const [summary, setSummary] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function selectFile(event: ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0];
    if (!selected) return;
    try {
      const parsed = parseGpx(await selected.text());
      onChange(selected);
      setSummary(
        `${parsed.distanceKm.toFixed(1)} km · ${parsed.durationMin === null ? "duration unavailable" : `${Math.round(parsed.durationMin)} min`}`,
      );
      setError(null);
    } catch (parseError) {
      onChange(null);
      setSummary(null);
      setError(
        parseError instanceof Error ? parseError.message : "The GPX file is invalid.",
      );
    }
  }

  return (
    <section className="editor-section" aria-labelledby="gpx-heading">
      <div className="section-heading">
        <div>
          <p>07</p>
          <h2 id="gpx-heading">Walk route</h2>
        </div>
        <span>Garmin / Strava</span>
      </div>
      <label className="gpx-picker" htmlFor={inputId}>
        <Route aria-hidden="true" />
        <span>
          <strong>{file?.name || existingName || "Import original GPX"}</strong>
          <small>{summary || "Distance and duration are derived from the track."}</small>
        </span>
      </label>
      <input
        className="sr-only"
        id={inputId}
        type="file"
        accept=".gpx,application/gpx+xml,application/xml,text/xml"
        onChange={selectFile}
      />
      {error ? (
        <p className="field-error" role="alert">
          {error}
        </p>
      ) : null}
    </section>
  );
}
