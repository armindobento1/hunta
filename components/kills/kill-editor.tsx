import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Spinner } from "@/components/ui/spinner";
import { applyKillEdit, type KillEdit } from "@/lib/domain/kill-edit";
import type { Kill, MediaAsset, RouteMetadata } from "@/lib/domain/kill";
import { getKill, saveKill } from "@/lib/firebase/kill-repository";
import {
  deleteStorageObject,
  uploadGpx,
  uploadMedia,
} from "@/lib/firebase/storage-repository";
import { useAuth } from "@/lib/hooks/use-auth";
import { useArmory } from "@/lib/hooks/use-armory";
import { useProfile } from "@/lib/hooks/use-profile";
import { SOCIAL_ENABLED } from "@/lib/features";
import { buildPublicHunt, buildPublicProfile } from "@/lib/domain/public-social";
import { getPublishedAt, publishHunt, savePublicProfile, unpublishHunt } from "@/lib/firebase/public-social-repository";

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
  const { items: armoryItems, loadouts } = useArmory();
  const { profile } = useProfile();
  const navigate = useNavigate();
  const [id] = useState(killId ?? recordId);
  const [initialKill, setInitialKill] = useState<Kill | null>(null);
  const [loading, setLoading] = useState(Boolean(killId));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploads, setUploads] = useState<UploadProgressItem[]>([]);

  useEffect(() => {
    if (!killId || !user) return;
    let cancelled = false;
    getKill(user.uid, killId)
      .then((kill) => {
        if (cancelled) return;
        setInitialKill(kill);
        setLoading(false);
        if (!kill) setError("That hunt record could not be found.");
      })
      .catch(() => {
        if (cancelled) return;
        setError("That hunt record could not be loaded.");
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
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
    const uploadedStoragePaths: string[] = [];

    try {
      let media: MediaAsset[] = [...submission.existingMedia];
      let route: RouteMetadata | null = initialKill?.route ?? null;
      // The public farm directory is retired (exact farm coordinates must
      // never be public — audit v1.1 F-01). A farmId already stored on an
      // older private record is kept as a private fact, but no farm is ever
      // created and the ID never enters the public projection.
      const farmId = submission.farmId.trim() || undefined;
      const factualEdit = {
        species: submission.species.trim(),
        country: submission.country.trim(),
        date: submission.date,
        killTime: submission.killTime,
        location: {
          latitude: submission.latitude,
          longitude: submission.longitude,
          placeName: submission.placeName.trim(),
          ...(submission.farmName.trim()
            ? { farmName: submission.farmName.trim() }
            : {}),
          ...(farmId ? { farmId } : {}),
          ...(submission.locationSourceProvider === "esri" && submission.locationSourceFeatureId && submission.locationSourceLabel ? { source: { provider: "esri" as const, featureId: submission.locationSourceFeatureId, label: submission.locationSourceLabel } } : {}),
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
        loadoutId: submission.loadoutId || null,
        equipmentAttachments: [
          submission.optic,
          submission.suppressor,
          submission.bipod,
          submission.sling,
          ...(submission.weaponType === "bow"
            ? [submission.arrow, submission.broadhead]
            : []),
        ].some((value) => value.trim())
          ? {
              ...(submission.optic.trim()
                ? { optic: { name: submission.optic.trim() } }
                : {}),
              ...(submission.suppressor.trim()
                ? { suppressor: { name: submission.suppressor.trim() } }
                : {}),
              ...(submission.bipod.trim()
                ? { bipod: { name: submission.bipod.trim() } }
                : {}),
              ...(submission.sling.trim()
                ? { sling: { name: submission.sling.trim() } }
                : {}),
              ...(submission.weaponType === "bow" && submission.arrow.trim()
                ? { arrow: { name: submission.arrow.trim() } }
                : {}),
              ...(submission.weaponType === "bow" &&
              submission.broadhead.trim()
                ? { broadhead: { name: submission.broadhead.trim() } }
                : {}),
            }
          : null,
        measurement: [
          submission.measureScore,
          submission.measureWeightDressed,
          submission.measureWeightUndressed,
        ].some(Number.isFinite)
          ? {
              ...(Number.isFinite(submission.measureScore)
                ? { score: submission.measureScore }
                : {}),
              ...(submission.measureScoreUnit.trim()
                ? { scoreUnit: submission.measureScoreUnit.trim() }
                : {}),
              ...(submission.measureScoringSystem.trim()
                ? { scoringSystem: submission.measureScoringSystem.trim() }
                : {}),
              ...(Number.isFinite(submission.measureWeightDressed)
                ? { weightDressed: submission.measureWeightDressed }
                : {}),
              ...(Number.isFinite(submission.measureWeightUndressed)
                ? { weightUndressed: submission.measureWeightUndressed }
                : {}),
              weightUnit: submission.measureWeightUnit,
            }
          : null,
        description: submission.description.trim(),
        isPublic: submission.isPublic,
      } satisfies KillEdit;

      let draft: Kill | null = null;
      if (!initialKill) {
        const {
          loadoutId,
          equipmentAttachments,
          measurement,
          ...requiredFacts
        } = factualEdit;
        draft = {
          id,
          ownerId: user.uid,
          ...requiredFacts,
          ...(loadoutId ? { loadoutId } : {}),
          ...(equipmentAttachments ? { equipmentAttachments } : {}),
          ...(measurement ? { measurement } : {}),
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
          uploadedStoragePaths.push(asset.storagePath);
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
        uploadedStoragePaths.push(uploaded.route.storagePath);
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
      if (SOCIAL_ENABLED && profile) {
        await savePublicProfile(buildPublicProfile(profile));
        if (submission.isPublic) {
          // Rules pin publishedAt as immutable: an edit of an existing
          // projection must republish with the original publication time.
          const publishedAt = initialKill?.isPublic ? await getPublishedAt(user.uid, id) : null;
          await publishHunt(buildPublicHunt(complete, profile, publishedAt ?? now));
        } else if (initialKill?.isPublic) {
          await unpublishHunt(user.uid, id);
        }
      }
      const removedStoragePaths = initialKill
        ? [
            ...initialKill.media
              .filter(
                (asset) =>
                  !complete.media.some((savedAsset) => savedAsset.id === asset.id),
              )
              .map((asset) => asset.storagePath),
            ...(submission.gpxFile && initialKill.route
              ? [initialKill.route.storagePath]
              : []),
          ]
        : [];
      await Promise.allSettled(
        removedStoragePaths.map((storagePath) =>
          deleteStorageObject(storagePath),
        ),
      );
      navigate(`/portfolio/kills/${id}`);
    } catch (saveError) {
      await Promise.allSettled(
        uploadedStoragePaths.map((storagePath) =>
          deleteStorageObject(storagePath),
        ),
      );
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Your hunt record could not be saved. Your draft is still available.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="centered-state">
        <Spinner label="Loading hunt record" />
      </main>
    );
  }

  if (killId && !initialKill) {
    return (
      <main className="centered-state">
        <p role="alert">{error || "Hunt record not found."}</p>
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
      armoryItems={armoryItems}
      loadouts={loadouts}
    />
  );
}
