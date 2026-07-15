"use client";

import { ImagePlus, Trash2 } from "lucide-react";
import { type ChangeEvent, useId, useState } from "react";

import type { MediaAsset } from "@/lib/domain/kill";
import { validateMediaFile } from "@/lib/firebase/storage-repository";

import type { PendingMedia } from "./types";

function newId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `media-${Date.now()}`;
}

export function MediaPicker({
  existingMedia,
  newMedia,
  coverMediaId,
  onExistingChange,
  onNewChange,
  onCoverChange,
  error,
}: {
  existingMedia: MediaAsset[];
  newMedia: PendingMedia[];
  coverMediaId: string | null;
  onExistingChange(media: MediaAsset[]): void;
  onNewChange(media: PendingMedia[]): void;
  onCoverChange(id: string | null): void;
  error?: string;
}) {
  const inputId = useId();
  const [fileError, setFileError] = useState<string | null>(null);

  function addFiles(event: ChangeEvent<HTMLInputElement>) {
    const selectedFiles = Array.from(event.target.files ?? []);
    if (existingMedia.length + newMedia.length + selectedFiles.length > 30) {
      setFileError("A record can hold up to 30 photos and videos.");
      event.target.value = "";
      return;
    }

    const additions: PendingMedia[] = [];
    try {
      for (const file of selectedFiles) {
        const { kind } = validateMediaFile(file);
        additions.push({ id: newId(), file, kind });
      }
      setFileError(null);
      onNewChange([...newMedia, ...additions]);
      if (!coverMediaId) {
        const firstPhoto = additions.find((item) => item.kind === "photo");
        if (firstPhoto) onCoverChange(firstPhoto.id);
      }
    } catch (uploadError) {
      setFileError(
        uploadError instanceof Error ? uploadError.message : "File not supported.",
      );
    } finally {
      event.target.value = "";
    }
  }

  function removeExisting(asset: MediaAsset) {
    if (!window.confirm(`Remove ${asset.fileName} from this record?`)) return;
    const remainingExisting = existingMedia.filter((item) => item.id !== asset.id);
    onExistingChange(remainingExisting);
    if (coverMediaId === asset.id) {
      onCoverChange(
        remainingExisting.find((item) => item.kind === "photo")?.id ??
          newMedia.find((item) => item.kind === "photo")?.id ??
          null,
      );
    }
  }

  function removePending(asset: PendingMedia) {
    const remainingNew = newMedia.filter((item) => item.id !== asset.id);
    onNewChange(remainingNew);
    if (coverMediaId === asset.id) {
      onCoverChange(
        existingMedia.find((item) => item.kind === "photo")?.id ??
          remainingNew.find((item) => item.kind === "photo")?.id ??
          null,
      );
    }
  }

  return (
    <section className="editor-section media-section" aria-labelledby="media-heading">
      <div className="section-heading">
        <div>
          <p>01</p>
          <h2 id="media-heading">Media</h2>
        </div>
        <span>Photos + video</span>
      </div>
      <label className="media-dropzone" htmlFor={inputId}>
        <ImagePlus aria-hidden="true" />
        <strong>Add photos or videos</strong>
        <span>Photos up to 15 MB · videos up to 250 MB</span>
      </label>
      <input
        className="sr-only"
        id={inputId}
        type="file"
        accept="image/*,video/*"
        multiple
        onChange={addFiles}
      />

      {existingMedia.length || newMedia.length ? (
        <div className="media-list">
          {existingMedia.map((asset) => (
            <div className="media-row" key={asset.id}>
              <span
                className="media-thumb"
                style={
                  asset.kind === "photo"
                    ? { backgroundImage: `url(${asset.downloadUrl})` }
                    : undefined
                }
              />
              <div>
                <strong>{asset.fileName}</strong>
                <span>Saved {asset.kind}</span>
              </div>
              {asset.kind === "photo" ? (
                <label>
                  <input
                    type="radio"
                    name="cover-media"
                    aria-label={`Use ${asset.fileName} as cover`}
                    checked={coverMediaId === asset.id}
                    onChange={() => onCoverChange(asset.id)}
                  />
                  Cover
                </label>
              ) : null}
              <button
                type="button"
                aria-label={`Remove ${asset.fileName}`}
                onClick={() => removeExisting(asset)}
              >
                <Trash2 aria-hidden="true" />
              </button>
            </div>
          ))}
          {newMedia.map((asset) => (
            <div className="media-row" key={asset.id}>
              <span className="media-thumb pending-thumb" aria-hidden="true" />
              <div>
                <strong>{asset.file.name}</strong>
                <span>Ready to upload</span>
              </div>
              {asset.kind === "photo" ? (
                <label>
                  <input
                    type="radio"
                    name="cover-media"
                    aria-label={`Use ${asset.file.name} as cover`}
                    checked={coverMediaId === asset.id}
                    onChange={() => onCoverChange(asset.id)}
                  />
                  Cover
                </label>
              ) : null}
              <button
                type="button"
                aria-label={`Remove ${asset.file.name}`}
                onClick={() => removePending(asset)}
              >
                <Trash2 aria-hidden="true" />
              </button>
            </div>
          ))}
        </div>
      ) : null}
      {fileError || error ? (
        <p className="field-error" role="alert">
          {fileError || error}
        </p>
      ) : null}
    </section>
  );
}
