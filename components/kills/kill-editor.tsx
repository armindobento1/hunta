"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Spinner } from "@/components/ui/spinner";
import { applyKillEdit } from "@/lib/domain/kill-edit";
import type { Kill, MediaAsset, RouteMetadata } from "@/lib/domain/kill";
import { getKill, saveKill } from "@/lib/firebase/kill-repository";
import { uploadGpx, uploadMedia } from "@/lib/firebase/storage-repository";
import { useAuth } from "@/lib/hooks/use-auth";

import { KillForm } from "./kill-form";
import type { KillFormSubmission, UploadProgressItem } from "./types";

function recordId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `kill-${Date.now()}`;
}

function equipment(submission: KillFormSubmission): Kill["weapon"] {
  return submission.weaponType === "rifle"
    ? {
        type: "rifle",
        model: submission.weaponModel.trim(),
        caliber: submission.caliber.trim(),
      }
    : {
        type: "bow",
        model: submission.weaponModel.trim(),
        bowType: submission.bowType.trim(),
      };
}

export function KillEditor({ killId }: { killId?: string }) {
  const { user } = useAuth();
  const router = useRouter();
  const [id] = useState(killId ?? recordId);
  const [initialKill, setInitialKill] = useState<Kill | null>(null);
  const [loading, setLoading] = useState(Boolean(killId));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploads, setUploads] = useState<UploadProgressItem[]>([]);

  useEffect(() => {
    if (!killId || !user) return;
    getKill(user.uid, killId)
      .then((kill) => {
        setInitialKill(kill);
        setLoading(false);
        if (!kill) setError("That fieldnote could not be found.");
      })
      .catch(() => {
        setError("That fieldnote could not be loaded.");
        setLoading(false);
      });
  }, [killId, user]);

  function progress(id: string, name: string, percent: number, status: UploadProgressItem["status"] = "uploading") {
    setUploads((current) => [
      ...current.filter((item) => item.id !== id),
      { id, name, percent, status },
    ]);
  }

  async function save(submission: KillFormSubmission) {
    if (!user) return;
    setSaving(true);
    setError(null);
    const now = new Date().toISOString();

    try {
      let media: MediaAsset[] = [...submission.existingMedia];
      let route: RouteMetadata | null = initialKill?.route ?? null;
      const factualEdit = {
        species: submission.species.trim(),
        country: submission.country.trim(),
        date: submission.date,
        killTime: submission.killTime,
        location: {
          latitude: submission.latitude,
          longitude: submission.longitude,
          placeName: submission.placeName.trim(),
        },
        weapon: equipment(submission),
        ammunition: {
          grain: submission.grain,
          ...(submission.ammunitionBrand.trim()
            ? { brand: submission.ammunitionBrand.trim() }
            : {}),
          ...(submission.ammunitionDetail.trim()
            ? { detail: submission.ammunitionDetail.trim() }
            : {}),
        },
        description: submission.description.trim(),
      } satisfies Partial<Kill>;

      let draft: Kill | null = null;
      if (!initialKill) {
        draft = {
          id,
          ownerId: user.uid,
          ...factualEdit,
          coverMediaId: null,
          media,
          route: null,
          status: "draft",
          createdAt: now,
          updatedAt: now,
          trashedAt: null,
        } as Kill;
        await saveKill(draft);
      }

      for (const pending of submission.newMedia) {
        progress(pending.id, pending.file.name, 0);
        try {
          const asset = await uploadMedia({
            uid: user.uid,
            killId: id,
            id: pending.id,
            file: pending.file,
            onProgress: (percent) => progress(pending.id, pending.file.name, percent),
          });
          media = [...media, asset];
          progress(pending.id, pending.file.name, 100, "complete");
          if (draft) {
            draft = applyKillEdit(draft, { media });
            await saveKill(draft);
          }
        } catch (uploadError) {
          progress(pending.id, pending.file.name, 0, "error");
          throw uploadError;
        }
      }

      if (submission.gpxFile) {
        const routeId = `route-${id}`;
        progress(routeId, submission.gpxFile.name, 0);
        const uploaded = await uploadGpx({
          uid: user.uid,
          killId: id,
          file: submission.gpxFile,
          onProgress: (percent) => progress(routeId, submission.gpxFile!.name, percent),
        });
        route = uploaded.route;
        progress(routeId, submission.gpxFile.name, 100, "complete");
      }

      const complete = initialKill
        ? applyKillEdit(initialKill, {
            ...factualEdit,
            coverMediaId: submission.coverMediaId,
            media,
            route,
            status: "active",
            trashedAt: null,
          })
        : applyKillEdit(draft!, {
            ...factualEdit,
            coverMediaId: submission.coverMediaId,
            media,
            route,
            status: "active",
          });
      await saveKill(complete);
      router.push(`/portfolio/kills/${id}`);
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Your fieldnote could not be saved. Your draft is still available.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="centered-state">
        <Spinner label="Loading fieldnote" />
      </main>
    );
  }

  if (killId && !initialKill) {
    return (
      <main className="centered-state">
        <p role="alert">{error || "Fieldnote not found."}</p>
      </main>
    );
  }

  return (
    <KillForm
      initialKill={initialKill ?? undefined}
      onSave={save}
      uploads={uploads}
      saving={saving}
      saveError={error}
    />
  );
}
