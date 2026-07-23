import {
  deleteObject,
  getBytes,
  getDownloadURL,
  ref,
  uploadBytesResumable,
  type UploadMetadata,
  type UploadTaskSnapshot,
} from "firebase/storage";

import type { MediaAsset, RouteMetadata } from "@/lib/domain/kill";
import { hashGpx, parseGpx } from "@/lib/gpx/parse-gpx";
import type { ParsedGpx } from "@/lib/gpx/types";

import { getFirebaseServices } from "./config";
import { optimizeImage } from "./optimize-image";

const IMAGE_LIMIT = 15 * 1024 * 1024;
const VIDEO_LIMIT = 250 * 1024 * 1024;
const GPX_LIMIT = 10 * 1024 * 1024;

export async function deleteStorageObject(storagePath: string): Promise<void> {
  await deleteObject(ref(getFirebaseServices().storage, storagePath));
}

export function sanitizeFileName(fileName: string): string {
  const normalized = fileName.trim().toLowerCase().normalize("NFKD");
  const extensionIndex = normalized.lastIndexOf(".");
  const extension =
    extensionIndex > 0
      ? normalized.slice(extensionIndex + 1).replace(/[^a-z0-9]/g, "")
      : "file";
  const base = (extensionIndex > 0 ? normalized.slice(0, extensionIndex) : normalized)
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100);

  return `${base || "upload"}.${extension || "file"}`;
}

export function validateMediaFile(file: File): { kind: "photo" | "video" } {
  if (file.size === 0) {
    throw new Error(`${file.name} is empty.`);
  }

  if (file.type.startsWith("image/")) {
    if (file.size > IMAGE_LIMIT) {
      throw new Error(`${file.name} is larger than the 15 MB photo limit.`);
    }
    return { kind: "photo" };
  }

  if (file.type.startsWith("video/")) {
    if (file.size > VIDEO_LIMIT) {
      throw new Error(`${file.name} is larger than the 250 MB video limit.`);
    }
    return { kind: "video" };
  }

  throw new Error(`${file.name} must be a photo or video.`);
}

export function validateGpxFile(file: File): void {
  if (!file.name.toLowerCase().endsWith(".gpx")) {
    throw new Error("Route files must use the .gpx extension.");
  }
  if (file.size === 0) {
    throw new Error(`${file.name} is empty.`);
  }
  if (file.size > GPX_LIMIT) {
    throw new Error(`${file.name} is larger than the 10 MB GPX limit.`);
  }
}

function upload(
  path: string,
  data: Blob | Uint8Array | ArrayBuffer,
  metadata: UploadMetadata,
  onProgress?: (percent: number) => void,
): Promise<UploadTaskSnapshot> {
  const task = uploadBytesResumable(
    ref(getFirebaseServices().storage, path),
    data,
    metadata,
  );

  return new Promise((resolve, reject) => {
    task.on(
      "state_changed",
      (snapshot) => {
        const percent = snapshot.totalBytes
          ? (snapshot.bytesTransferred / snapshot.totalBytes) * 100
          : 0;
        onProgress?.(percent);
      },
      reject,
      () => resolve(task.snapshot),
    );
  });
}

export async function uploadMedia(options: {
  uid: string;
  killId: string;
  id?: string;
  file: File;
  onProgress?: (percent: number) => void;
}): Promise<MediaAsset> {
  const { kind } = validateMediaFile(options.file);
  const fileToUpload =
    kind === "photo" ? await optimizeImage(options.file) : options.file;
  const id = options.id ?? crypto.randomUUID();
  const path = `users/${options.uid}/kills/${options.killId}/media/${id}-${sanitizeFileName(fileToUpload.name)}`;
  const snapshot = await upload(
    path,
    fileToUpload,
    { contentType: fileToUpload.type },
    options.onProgress,
  );

  return {
    id,
    kind,
    storagePath: path,
    downloadUrl: await getDownloadURL(snapshot.ref),
    fileName: fileToUpload.name,
    contentType: fileToUpload.type,
    sizeBytes: fileToUpload.size,
    createdAt: new Date().toISOString(),
  };
}

export async function uploadGpx(options: {
  uid: string;
  killId: string;
  file: File;
  onProgress?: (percent: number) => void;
}): Promise<{ route: RouteMetadata; parsed: ParsedGpx }> {
  validateGpxFile(options.file);
  const rawGpx = await options.file.text();
  const parsed = parseGpx(rawGpx);
  const id = crypto.randomUUID();
  const path = `users/${options.uid}/kills/${options.killId}/routes/${id}.gpx`;
  await upload(
    path,
    options.file,
    { contentType: "application/gpx+xml" },
    options.onProgress,
  );

  return {
    parsed,
    route: {
      storagePath: path,
      fileName: options.file.name,
      distanceKm: parsed.distanceKm,
      durationMin: parsed.durationMin,
      bounds: parsed.bounds,
      sourceHash: await hashGpx(rawGpx),
    },
  };
}

export async function downloadGpx(storagePath: string): Promise<string> {
  const bytes = await getBytes(
    ref(getFirebaseServices().storage, storagePath),
    GPX_LIMIT,
  );
  return new TextDecoder().decode(bytes);
}

export async function uploadAvatar({
  uid,
  file,
}: {
  uid: string;
  file: File;
}): Promise<string> {
  const { kind } = validateMediaFile(file);
  if (kind !== "photo") {
    throw new Error("An avatar must be a photo.");
  }
  const optimized = await optimizeImage(file, { maxDimension: 768 });
  const id = crypto.randomUUID();
  const path = `users/${uid}/avatars/${id}-${sanitizeFileName(optimized.name)}`;
  const snapshot = await upload(path, optimized, {
    contentType: optimized.type,
  });
  return getDownloadURL(snapshot.ref);
}
