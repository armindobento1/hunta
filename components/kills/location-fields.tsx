"use client";

import { LocateFixed, MapPin, Search } from "lucide-react";
import { useEffect, useState } from "react";
import type { FieldErrors, UseFormRegister, UseFormSetValue } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { searchLocations, type LocationSearchResult } from "@/lib/location/search-locations";

import type { EditorFields } from "./kill-form";

export function LocationFields({
  register,
  setValue,
  errors,
  country,
}: {
  register: UseFormRegister<EditorFields>;
  setValue: UseFormSetValue<EditorFields>;
  errors: FieldErrors<EditorFields>;
  country: string;
}) {
  const [locationError, setLocationError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<LocationSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [refine, setRefine] = useState(false);
  const farmRegistration = register("farmName", { required: "Farm name is required." });

  useEffect(() => {
    if (query.trim().length < 3) return;
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setSearching(true);
      searchLocations(`${query}${country ? `, ${country}` : ""}`, { signal: controller.signal })
        .then(setResults)
        .catch((cause) => { if ((cause as Error).name !== "AbortError") setLocationError("Location search is temporarily unavailable."); })
        .finally(() => setSearching(false));
    }, 300);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [country, query]);

  function choose(result: LocationSearchResult) {
    setQuery(result.label);
    setResults([]);
    setValue("farmName", result.label, { shouldValidate: true });
    setValue("placeName", result.context || result.region || result.label, { shouldValidate: true });
    if (!country && result.country) setValue("country", result.country, { shouldValidate: true });
    setValue("latitude", result.latitude, { shouldValidate: true });
    setValue("longitude", result.longitude, { shouldValidate: true });
    setValue("locationSourceProvider", "esri");
    setValue("locationSourceFeatureId", result.id);
    setValue("locationSourceLabel", result.label);
    setLocationError(null);
  }

  function useCurrentPosition() {
    if (!navigator.geolocation) {
      setLocationError("Current-position access is not available in this browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setValue("latitude", coords.latitude, { shouldValidate: true });
        setValue("longitude", coords.longitude, { shouldValidate: true });
        setRefine(true);
        setLocationError(null);
      },
      () => setLocationError("Position permission was not granted."),
      { enableHighAccuracy: true, timeout: 15_000 },
    );
  }

  return (
    <section className="editor-section" aria-labelledby="location-heading">
      <div className="section-heading">
        <div>
          <p>03</p>
          <h2 id="location-heading">Location</h2>
        </div>
        <Button type="button" variant="secondary" onClick={useCurrentPosition}>
          <LocateFixed aria-hidden="true" size={16} /> Use current position
        </Button>
      </div>
      <div className="req-field-wrapper">
        <div className="req-field-header">
          <label className="req-field-label" htmlFor="farm-name">
            Farm name <span className="req-asterisk">*</span>
          </label>
          <span className="req-badge">
            <span className="req-dot" aria-hidden="true" /> Required
          </span>
        </div>
        <div className="location-search-box">
          <Search aria-hidden="true" />
          <Input id="farm-name" placeholder="Search a farm, reserve, or place" autoComplete="off" aria-invalid={Boolean(errors.farmName)} aria-describedby={errors.farmName ? "farm-name-error" : undefined} {...farmRegistration} onChange={(event) => { farmRegistration.onChange(event); setQuery(event.target.value); if (event.target.value.trim().length < 3) setResults([]); }} />
          {searching ? <span className="location-searching">Searching…</span> : null}
        </div>
        {results.length ? <div className="location-results" role="listbox" aria-label="Location search results">{results.map((result) => <button type="button" role="option" aria-selected="false" key={result.id} onClick={() => choose(result)}><MapPin aria-hidden="true" /><span><strong>{result.label}</strong><small>{result.context}</small></span></button>)}</div> : null}
        {errors.farmName ? (
          <p id="farm-name-error" className="field-error" role="alert">
            {errors.farmName.message}
          </p>
        ) : null}
      </div>
      <FormField
        label="Place name"
        htmlFor="place-name"
        error={errors.placeName?.message}
      >
        <Input
          id="place-name"
          placeholder="Eastern Cape"
          {...register("placeName", { required: "Place name is required." })}
        />
      </FormField>
      <button className="coordinate-toggle" type="button" onClick={() => setRefine((value) => !value)}>{refine ? "Hide exact coordinates" : "Refine exact coordinates (optional)"}</button>
      {refine ? <div className="editor-grid two-columns">
        <FormField
          label="Latitude"
          htmlFor="latitude"
          error={errors.latitude?.message}
        >
          <Input
            id="latitude"
            type="number"
            step="any"
            {...register("latitude", {
              valueAsNumber: true,
              validate: (value) =>
                (Number.isFinite(value) && value >= -90 && value <= 90) ||
                "Enter a valid latitude.",
            })}
          />
        </FormField>
        <FormField
          label="Longitude"
          htmlFor="longitude"
          error={errors.longitude?.message}
        >
          <Input
            id="longitude"
            type="number"
            step="any"
            {...register("longitude", {
              valueAsNumber: true,
              validate: (value) =>
                (Number.isFinite(value) && value >= -180 && value <= 180) ||
                "Enter a valid longitude.",
            })}
          />
        </FormField>
      </div> : null}
      {locationError ? (
        <p className="field-error" role="alert">
          {locationError}
        </p>
      ) : null}
    </section>
  );
}
