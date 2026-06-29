"use client";

import { LocateFixed } from "lucide-react";
import { useState } from "react";
import type { FieldErrors, UseFormRegister, UseFormSetValue } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";

import type { EditorFields } from "./kill-form";

export function LocationFields({
  register,
  setValue,
  errors,
}: {
  register: UseFormRegister<EditorFields>;
  setValue: UseFormSetValue<EditorFields>;
  errors: FieldErrors<EditorFields>;
}) {
  const [locationError, setLocationError] = useState<string | null>(null);

  function useCurrentPosition() {
    if (!navigator.geolocation) {
      setLocationError("Current-position access is not available in this browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setValue("latitude", coords.latitude, { shouldValidate: true });
        setValue("longitude", coords.longitude, { shouldValidate: true });
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
      <div className="editor-grid two-columns">
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
      </div>
      {locationError ? (
        <p className="field-error" role="alert">
          {locationError}
        </p>
      ) : null}
    </section>
  );
}
