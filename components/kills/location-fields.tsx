"use client";

import { LocateFixed, MapPin, Search } from "lucide-react";
import { useEffect, useState } from "react";
import type { Control, FieldErrors, UseFormRegister, UseFormSetValue } from "react-hook-form";
import { useWatch } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { LocationPickerMap } from "@/components/map/location-picker-map";
import type { FarmSuggestion } from "@/lib/domain/farm";
import { searchLocations, type LocationSearchResult } from "@/lib/location/search-locations";

import type { EditorFields } from "./kill-form";

export function LocationFields({
  register,
  setValue,
  control,
  errors,
  country,
  findNearbyFarms,
}: {
  register: UseFormRegister<EditorFields>;
  setValue: UseFormSetValue<EditorFields>;
  control: Control<EditorFields>;
  errors: FieldErrors<EditorFields>;
  country: string;
  findNearbyFarms?(country: string, latitude: number, longitude: number): Promise<FarmSuggestion[]>;
}) {
  const [locationError, setLocationError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<LocationSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [refine, setRefine] = useState(false);
  const latitude = useWatch({ control, name: "latitude" });
  const longitude = useWatch({ control, name: "longitude" });
  const placeName = useWatch({ control, name: "placeName" });
  const farmId = useWatch({ control, name: "farmId" });
  const hasPin = Number.isFinite(latitude) && Number.isFinite(longitude);
  const [farmSuggestions, setFarmSuggestions] = useState<FarmSuggestion[]>([]);

  useEffect(() => {
    if (!findNearbyFarms || !Number.isFinite(latitude) || !Number.isFinite(longitude)) return;
    let cancelled = false;
    const timer = window.setTimeout(() => {
      findNearbyFarms(country, latitude, longitude)
        .then((suggestions) => { if (!cancelled) setFarmSuggestions(suggestions); })
        .catch(() => { if (!cancelled) setFarmSuggestions([]); });
    }, 400);
    return () => { cancelled = true; window.clearTimeout(timer); };
  }, [findNearbyFarms, country, latitude, longitude]);

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

  function dropPin(nextLatitude: number, nextLongitude: number) {
    setValue("latitude", nextLatitude, { shouldValidate: true });
    setValue("longitude", nextLongitude, { shouldValidate: true });
    // Pinned coordinates are user-authored facts — drop stale geocoder provenance.
    setValue("locationSourceProvider", "");
    setValue("locationSourceFeatureId", "");
    setValue("locationSourceLabel", "");
    setLocationError(null);
  }

  function adoptFarm(suggestion: FarmSuggestion) {
    setValue("farmName", suggestion.farm.name, { shouldValidate: true });
    setValue("farmId", suggestion.farm.id);
    if (!placeName?.trim()) setValue("placeName", suggestion.farm.placeName, { shouldValidate: true });
    if (!country && suggestion.farm.country) setValue("country", suggestion.farm.country, { shouldValidate: true });
  }

  function jumpTo(result: LocationSearchResult) {
    setQuery("");
    setResults([]);
    setValue("latitude", result.latitude, { shouldValidate: true });
    setValue("longitude", result.longitude, { shouldValidate: true });
    if (!placeName?.trim()) setValue("placeName", result.context || result.region || result.label, { shouldValidate: true });
    if (!country && result.country) setValue("country", result.country, { shouldValidate: true });
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
        dropPin(coords.latitude, coords.longitude);
        setRefine(true);
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
        <Input
          id="farm-name"
          placeholder="Name of the farm, reserve, or concession"
          autoComplete="off"
          aria-invalid={Boolean(errors.farmName)}
          aria-describedby={errors.farmName ? "farm-name-error" : undefined}
          {...register("farmName", {
            required: "Farm name is required.",
            onChange: () => { if (farmId) setValue("farmId", ""); },
          })}
        />
        {hasPin && farmSuggestions.length ? (
          <div className="farm-suggestions" aria-label="Nearby community farms">
            <p>Hunted at a known farm?</p>
            {farmSuggestions.map((suggestion) => (
              <button
                type="button"
                key={suggestion.farm.id}
                className={farmId === suggestion.farm.id ? "farm-suggestion-active" : undefined}
                onClick={() => adoptFarm(suggestion)}
              >
                <MapPin aria-hidden="true" />
                <span>
                  <strong>{suggestion.farm.name}</strong>
                  <small>{suggestion.farm.placeName} · {suggestion.distanceKm.toFixed(1)} km from your pin</small>
                </span>
              </button>
            ))}
          </div>
        ) : null}
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
      <div className="req-field-wrapper">
        <div className="req-field-header">
          <span className="req-field-label">
            Drop the pin <span className="req-asterisk">*</span>
          </span>
          <span className="req-badge">
            <span className="req-dot" aria-hidden="true" />{" "}
            {hasPin ? "Pin set" : "Required"}
          </span>
        </div>
        <p className="section-hint">
          Tap the satellite map to mark the exact kill location. Search below to
          jump the map near a town or region first — private farms are usually
          not searchable.
        </p>
        <div className="location-search-box">
          <Search aria-hidden="true" />
          <Input
            id="map-search"
            aria-label="Jump map to a town or region"
            placeholder="Jump map to a town or region"
            autoComplete="off"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              if (event.target.value.trim().length < 3) setResults([]);
            }}
          />
          {searching ? <span className="location-searching">Searching…</span> : null}
        </div>
        {results.length ? (
          <div className="location-results" role="listbox" aria-label="Location search results">
            {results.map((result) => (
              <button type="button" role="option" aria-selected="false" key={result.id} onClick={() => jumpTo(result)}>
                <MapPin aria-hidden="true" />
                <span>
                  <strong>{result.label}</strong>
                  <small>{result.context}</small>
                </span>
              </button>
            ))}
          </div>
        ) : null}
        <LocationPickerMap latitude={latitude} longitude={longitude} onPick={dropPin} />
        {hasPin ? (
          <p className="pin-readout">
            <MapPin aria-hidden="true" size={14} /> Pin at {latitude.toFixed(5)}, {longitude.toFixed(5)}
          </p>
        ) : null}
      </div>
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
