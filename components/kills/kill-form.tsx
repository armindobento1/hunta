import { ArrowLeft, Save } from "lucide-react";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import type { FarmSuggestion } from "@/lib/domain/farm";
import type { Kill, MediaAsset } from "@/lib/domain/kill";
import { resolveLoadout, type ArmoryItem, type Loadout } from "@/lib/domain/armory";

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
  farmName: string;
  farmId: string;
  latitude: number;
  longitude: number;
  weaponType: "rifle" | "bow";
  weaponModel: string;
  caliber: string;
  bowType: string;
  grain: number;
  ammunitionBrand: string;
  ammunitionDetail: string;
  loadoutId: string;
  optic: string;
  suppressor: string;
  bipod: string;
  sling: string;
  locationSourceProvider: "" | "esri";
  locationSourceFeatureId: string;
  locationSourceLabel: string;
  measureScore: number;
  measureScoreUnit: string;
  measureScoringSystem: string;
  measureWeightDressed: number;
  measureWeightUndressed: number;
  measureWeightUnit: "kg" | "lb";
  description: string;
  isPublic: boolean;
}

function defaults(initial?: Kill): EditorFields {
  return {
    species: initial?.species ?? "",
    country: initial?.country ?? "",
    date: initial?.date ?? "",
    killTime: initial?.killTime ?? "",
    placeName: initial?.location.placeName ?? "",
    farmName: initial?.location.farmName ?? "",
    farmId: initial?.location.farmId ?? "",
    latitude: initial?.location.latitude ?? Number.NaN,
    longitude: initial?.location.longitude ?? Number.NaN,
    weaponType: initial?.weapon.type ?? "rifle",
    weaponModel: initial?.weapon.model ?? "",
    caliber: initial?.weapon.type === "rifle" ? initial.weapon.caliber : "",
    bowType: initial?.weapon.type === "bow" ? initial.weapon.bowType : "",
    grain: initial?.ammunition.grain ?? Number.NaN,
    ammunitionBrand: initial?.ammunition.brand ?? "",
    ammunitionDetail: initial?.ammunition.detail ?? "",
    loadoutId: initial?.loadoutId ?? "",
    optic: initial?.equipmentAttachments?.optic?.name ?? "",
    suppressor: initial?.equipmentAttachments?.suppressor?.name ?? "",
    bipod: initial?.equipmentAttachments?.bipod?.name ?? "",
    sling: initial?.equipmentAttachments?.sling?.name ?? "",
    locationSourceProvider: initial?.location.source?.provider ?? "",
    locationSourceFeatureId: initial?.location.source?.featureId ?? "",
    locationSourceLabel: initial?.location.source?.label ?? "",
    measureScore: initial?.measurement?.score ?? Number.NaN,
    measureScoreUnit: initial?.measurement?.scoreUnit ?? "in",
    measureScoringSystem: initial?.measurement?.scoringSystem ?? "SCI",
    measureWeightDressed:
      initial?.measurement?.weightDressed ?? Number.NaN,
    measureWeightUndressed:
      initial?.measurement?.weightUndressed ?? Number.NaN,
    measureWeightUnit: initial?.measurement?.weightUnit ?? "kg",
    description: initial?.description ?? "",
    isPublic: initial?.isPublic ?? false,
  };
}

export function KillForm({
  initialKill,
  onSave,
  uploads = [],
  saving = false,
  saveError,
  armoryItems = [],
  loadouts = [],
  findNearbyFarms,
}: {
  initialKill?: Kill;
  onSave(submission: KillFormSubmission): Promise<void> | void;
  uploads?: UploadProgressItem[];
  saving?: boolean;
  saveError?: string | null;
  armoryItems?: ArmoryItem[];
  loadouts?: Loadout[];
  findNearbyFarms?(country: string, latitude: number, longitude: number): Promise<FarmSuggestion[]>;
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
  const weightUnit = useWatch({ control, name: "measureWeightUnit" });
  const country = useWatch({ control, name: "country" });
  const isPublic = useWatch({ control, name: "isPublic" });

  function selectLoadout(loadoutId: string) {
    setValue("loadoutId", loadoutId);
    const loadout = loadouts.find((item) => item.id === loadoutId);
    if (!loadout) return;
    const resolved = resolveLoadout(loadout, armoryItems);
    setValue("weaponType", resolved.weapon.type);
    setValue("weaponModel", resolved.weapon.model);
    setValue("caliber", resolved.weapon.type === "rifle" ? resolved.weapon.caliber : "");
    setValue("bowType", resolved.weapon.type === "bow" ? resolved.weapon.bowType : "");
    setValue("grain", resolved.ammunition?.grain ?? Number.NaN);
    setValue("ammunitionBrand", resolved.ammunition?.brand ?? "");
    setValue("ammunitionDetail", resolved.ammunition?.detail ?? "");
    for (const kind of ["optic", "suppressor", "bipod", "sling"] as const) {
      setValue(kind, resolved.attachments[kind]?.name ?? "");
    }
  }

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
        <Link to={initialKill ? `/portfolio/kills/${initialKill.id}` : "/portfolio"}>
          <ArrowLeft aria-hidden="true" /> Back
        </Link>
        <div>
          <p className="eyebrow">Private field record</p>
          <h1>{initialKill ? "Edit hunt record" : "New hunt record"}</h1>
        </div>
        <Button type="submit" disabled={saving}>
          <Save aria-hidden="true" size={17} /> Save hunt record
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

      <LocationFields register={register} setValue={setValue} control={control} errors={errors} country={country} findNearbyFarms={findNearbyFarms} />
      <section className="editor-section" aria-labelledby="measurements-heading">
        <div className="section-heading">
          <div>
            <p>04</p>
            <h2 id="measurements-heading">Measurements</h2>
          </div>
          <span>Optional</span>
        </div>
        <p className="section-hint">
          Add trophy details later if they are not available in the field.
        </p>
        <div className="editor-grid measurement-grid">
          <FormField label="Score / size" htmlFor="measure-score">
            <div className="input-with-unit">
              <Input
                id="measure-score"
                type="number"
                step="any"
                placeholder="e.g. 56.875"
                {...register("measureScore", { valueAsNumber: true })}
              />
              <select
                className="unit-select"
                aria-label="Score unit"
                {...register("measureScoreUnit")}
              >
                <option value="in">in</option>
                <option value="cm">cm</option>
                <option value="pts">pts</option>
              </select>
            </div>
          </FormField>
          <FormField label="Scoring system" htmlFor="measure-system">
            <Input
              id="measure-system"
              placeholder="SCI or Rowland Ward"
              {...register("measureScoringSystem")}
            />
          </FormField>
        </div>
        <div className="editor-grid two-columns">
          <FormField label="Dressed weight" htmlFor="weight-dressed">
            <div className="input-with-unit">
              <Input
                id="weight-dressed"
                type="number"
                step="any"
                placeholder="—"
                {...register("measureWeightDressed", { valueAsNumber: true })}
              />
              <span className="unit-label" aria-hidden="true">
                {weightUnit}
              </span>
            </div>
          </FormField>
          <FormField label="Undressed weight" htmlFor="weight-undressed">
            <div className="input-with-unit">
              <Input
                id="weight-undressed"
                type="number"
                step="any"
                placeholder="—"
                {...register("measureWeightUndressed", { valueAsNumber: true })}
              />
              <select
                className="unit-select"
                aria-label="Weight unit"
                {...register("measureWeightUnit")}
              >
                <option value="kg">kg</option>
                <option value="lb">lb</option>
              </select>
            </div>
          </FormField>
        </div>
      </section>
      <section className="editor-section" aria-labelledby="loadout-heading">
        <div className="section-heading"><div><p>05</p><h2 id="loadout-heading">Armory loadout</h2></div><span>Optional</span></div>
        <p className="section-hint">Choose a saved setup to fill the weapon, ammunition, and attachments. You can still adjust the hunt snapshot below.</p>
        <FormField label="Saved loadout" htmlFor="loadout-id">
          <select id="loadout-id" className="text-input" {...register("loadoutId")} onChange={(event) => selectLoadout(event.target.value)}>
            <option value="">Enter equipment manually</option>
            {loadouts.map((loadout) => <option key={loadout.id} value={loadout.id}>{loadout.name}{loadout.isDefault ? " · Default" : ""}</option>)}
          </select>
        </FormField>
        {loadouts.length === 0 ? <p className="section-hint">Create reusable setups in the Armory tab.</p> : null}
      </section>
      <WeaponFields register={register} errors={errors} weaponType={weaponType} />
      <div className="editor-grid two-columns attachment-snapshot-fields">
        {(["optic", "suppressor", "bipod", "sling"] as const).map((kind) => <FormField key={kind} label={kind[0].toUpperCase() + kind.slice(1)} htmlFor={`attachment-${kind}`}><Input id={`attachment-${kind}`} {...register(kind)} /></FormField>)}
      </div>
      <GpxPicker
        file={gpxFile}
        existingName={initialKill?.route?.fileName}
        onChange={setGpxFile}
      />

      <section className="editor-section" aria-labelledby="story-heading">
        <div className="section-heading">
          <div>
            <p>08</p>
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

      <section className="editor-section publish-section" aria-labelledby="publish-heading">
        <div className="section-heading"><div><p>09</p><h2 id="publish-heading">Public activity</h2></div><span>Optional</span></div>
        <label className="publish-toggle"><input type="checkbox" {...register("isPublic")} /><span><strong>Publish publicly</strong><small>Show this hunt in Discover, followers’ feeds, and public leaderboards.</small></span></label>
        {isPublic ? <p className="publish-warning" role="note">Your farm name and exact GPS coordinates will be visible to everyone.</p> : null}
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
          {saving ? "Saving…" : "Save hunt record"}
        </Button>
      </div>
    </form>
  );
}
