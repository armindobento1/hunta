import type { MediaAsset } from "@/lib/domain/kill";

export interface PendingMedia {
  id: string;
  file: File;
  kind: "photo" | "video";
}

export interface KillFormSubmission {
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
  existingMedia: MediaAsset[];
  newMedia: PendingMedia[];
  coverMediaId: string;
  gpxFile: File | null;
}

export interface UploadProgressItem {
  id: string;
  name: string;
  percent: number;
  status: "uploading" | "complete" | "error";
}
