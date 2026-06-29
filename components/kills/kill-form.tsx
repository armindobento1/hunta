"use client";

import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import type { Kill, MediaAsset } from "@/lib/domain/kill";

import { GpxPicker } from "./gpx-picker";
import { LocationFields } from "./location-fields";
import { MediaPicker } from "./media-picker";
import type {
  KillFormSubmission,
  PendingMedia,
  UploadProgressItem,
} from "./types";
import { UploadList } from "./upload-list";
import { WeaponFields } from "./weapon-fields";

export interface EditorFields {
  species: string;
  country: string;
  date: string;
  killTime: string;
  placeName: string;
  latitude: number;
  longitude: number;
  weaponType: "rifle" | "bow";
  weaponModel: string;
  caliber: string;
  bowType: string;
  grain: number;
  ammunitionBrand: string;
  ammunitionDetail: string;
  description: string;
}

function defaults(initial?: Kill): EditorFields {
  return {
    species: initial?.species ?? "",
    country: initial?.country ?? "",
    date: initial?.date ?? "",
    killTime: initial?.killTime ?? "",
    placeName: initial?.location.placeName ?? "",
    latitude: initial?.location.latitude ?? Number.NaN,
    longitude: initial?.location.longitude ?? Number.NaN,
    weaponType: initial?.weapon.type ?? "rifle",
    weaponModel: initial?.weapon.model ?? "",
    caliber: initial?.weapon.type === "rifle" ? initial.weapon.caliber : "",
    bowType: initial?.weapon.type === "bow" ? initial.weapon.bowType : "",
    grain: initial?.ammunition.grain ?? Number.NaN,
    ammunitionBrand: initial?.ammunition.brand ?? "",
    ammunitionDetail: initial?.ammunition.detail ?? "",
    description: initial?.description ?? "",
  };
}

export function KillForm({
  initialKill,
  onSave,
  uploads = [],
  saving = false,
  saveError,
}: {
  initialKill?: Kill;
  onSave(submission: KillFormSubmission): Promise<void> | void;
  uploads?: UploadProgressItem[];
  saving?: boolean;
  saveError?: string | null;
}) {
  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<EditorFields>({ defaultValues: defaults(initialKill) });
  const [existingMedia, setExistingMedia] = useState<MediaAsset[]>(
    initialKill?.media ?? [],
  );
  const [newMedia, setNewMedia] = useState<PendingMedia[]>([]);
  const [coverMediaId, setCoverMediaId] = useState<string | null>(
    initialKill?.coverMediaId ?? null,
  );
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [gpxFile, setGpxFile] = useState<File | null>(null);
  const weaponType = useWatch({ control, name: "weaponType" });

  function validateCover(): boolean {
    const availableCover = [...existingMedia.map((item) => item.id), ...newMedia.map((item) => item.id)];
    if (!coverMediaId || !availableCover.includes(coverMediaId)) {
      setMediaError("A cover photo is required.");
      return false;
    }
    const coverIsPhoto =
      existingMedia.some((item) => item.id === coverMediaId && item.kind === "photo") ||
      newMedia.some((item) => item.id === coverMediaId && item.kind === "photo");
    if (!coverIsPhoto) {
      setMediaError("The cover must be a photo.");
      return false;
    }
    setMediaError(null);
    return true;
  }

  const submit = handleSubmit(async (values) => {
    if (!validateCover()) return;
    const confirmedCover = coverMediaId;
    if (!confirmedCover) return;
    await onSave({
      ...values,
      existingMedia,
      newMedia,
      coverMediaId: confirmedCover,
      gpxFile,
    });
  }, () => {
    validateCover();
  });

  return (
    <form className="kill-editor" onSubmit={submit} noValidate>
      <header className="editor-header">
        <Link href={initialKill ? `/portfolio/kills/${initialKill.id}` : "/portfolio"}>
          <ArrowLeft aria-hidden="true" /> Back
        </Link>
        <div>
          <p className="eyebrow">Private field record</p>
          <h1>{initialKill ? "Edit fieldnote" : "New fieldnote"}</h1>
        </div>
        <Button type="submit" disabled={saving}>
          <Save aria-hidden="true" size={17} /> Save fieldnote
        </Button>
      </header>

      <MediaPicker
        existingMedia={existingMedia}
        newMedia={newMedia}
        coverMediaId={coverMediaId}
        onExistingChange={setExistingMedia}
        onNewChange={setNewMedia}
        onCoverChange={setCoverMediaId}
        error={mediaError ?? undefined}
      />

      <section className="editor-section" aria-labelledby="facts-heading">
        <div className="section-heading">
          <div>
            <p>02</p>
            <h2 id="facts-heading">Hunt facts</h2>
          </div>
          <span>Required</span>
        </div>
        <div className="editor-grid two-columns">
          <FormField
            label="Species"
            htmlFor="species"
            error={errors.species?.message}
          >
            <Input
              id="species"
              {...register("species", { required: "Species is required." })}
            />
          </FormField>
          <FormField
            label="Country"
            htmlFor="country"
            error={errors.country?.message}
          >
            <Input
              id="country"
              {...register("country", { required: "Country is required." })}
            />
          </FormField>
        </div>
        <div className="editor-grid two-columns">
          <FormField label="Date" htmlFor="date" error={errors.date?.message}>
            <Input
              id="date"
              type="date"
              {...register("date", { required: "Date is required." })}
            />
          </FormField>
          <FormField
            label="Exact kill time"
            htmlFor="kill-time"
            error={errors.killTime?.message}
          >
            <Input
              id="kill-time"
              type="time"
              {...register("killTime", { required: "Kill time is required." })}
            />
          </FormField>
        </div>
      </section>

      <LocationFields register={register} setValue={setValue} errors={errors} />
      <WeaponFields register={register} errors={errors} weaponType={weaponType} />
      <GpxPicker
        file={gpxFile}
        existingName={initialKill?.route?.fileName}
        onChange={setGpxFile}
      />

      <section className="editor-section" aria-labelledby="story-heading">
        <div className="section-heading">
          <div>
            <p>06</p>
            <h2 id="story-heading">Hunt story</h2>
          </div>
          <span>Optional</span>
        </div>
        <FormField label="Hunt story" htmlFor="description">
          <textarea
            id="description"
            className="text-input story-input"
            maxLength={5000}
            {...register("description")}
          />
        </FormField>
      </section>

      <UploadList items={uploads} />
      {saveError ? (
        <p className="editor-save-error" role="alert">
          {saveError}
        </p>
      ) : null}
      <div className="editor-submit-row">
        <Button type="submit" disabled={saving}>
          <Save aria-hidden="true" size={17} />
          {saving ? "Saving…" : "Save fieldnote"}
        </Button>
      </div>
    </form>
  );
}
