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
