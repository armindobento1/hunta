import { z } from "zod";

const trimmed = (max: number) => z.string().trim().min(1).max(max);

export const mediaAssetSchema = z
  .object({
    id: z.string().min(1),
    kind: z.enum(["photo", "video"]),
    storagePath: z.string().min(1),
    downloadUrl: z.string().url(),
    fileName: trimmed(180),
    contentType: trimmed(100),
    sizeBytes: z.number().int().positive(),
    createdAt: z.string().datetime(),
  })
  .strict();

export const killLocationSchema = z
  .object({
    latitude: z.number().finite().min(-90).max(90),
    longitude: z.number().finite().min(-180).max(180),
    placeName: trimmed(160),
    farmName: z.string().trim().min(1).max(200).optional(),
    source: z.object({
      provider: z.literal("esri"),
      featureId: trimmed(240),
      label: trimmed(240),
    }).strict().optional(),
  })
  .strict();

export const rifleSchema = z
  .object({
    type: z.literal("rifle"),
    model: trimmed(120),
    caliber: trimmed(80),
  })
  .strict();

export const bowSchema = z
  .object({
    type: z.literal("bow"),
    model: trimmed(120),
    bowType: trimmed(80),
  })
  .strict();

export const weaponSchema = z.discriminatedUnion("type", [
  rifleSchema,
  bowSchema,
]);

export const ammunitionSchema = z
  .object({
    grain: z.number().finite().positive().max(2_000),
    brand: z.string().trim().max(100).optional(),
    detail: z.string().trim().max(160).optional(),
  })
  .strict();

export const measurementSchema = z
  .object({
    score: z.number().finite().positive().optional(),
    scoreUnit: z.string().trim().min(1).max(40).optional(),
    scoringSystem: z.string().trim().min(1).max(80).optional(),
    weightDressed: z.number().finite().positive().optional(),
    weightUndressed: z.number().finite().positive().optional(),
    weightUnit: z.enum(["kg", "lb"]).optional(),
  })
  .strict();

const attachmentSnapshotSchema = z.object({
  name: trimmed(120),
  detail: z.string().trim().max(160).optional(),
}).strict();

export const equipmentAttachmentsSchema = z.object({
  optic: attachmentSnapshotSchema.optional(),
  suppressor: attachmentSnapshotSchema.optional(),
  bipod: attachmentSnapshotSchema.optional(),
  sling: attachmentSnapshotSchema.optional(),
}).strict();

export const routeBoundsSchema = z
  .object({
    south: z.number().finite().min(-90).max(90),
    west: z.number().finite().min(-180).max(180),
    north: z.number().finite().min(-90).max(90),
    east: z.number().finite().min(-180).max(180),
  })
  .strict()
  .refine((bounds) => bounds.south <= bounds.north, {
    message: "South bound must not exceed north bound",
  });

export const routeMetadataSchema = z
  .object({
    storagePath: z.string().min(1),
    fileName: trimmed(180),
    distanceKm: z.number().finite().nonnegative(),
    durationMin: z.number().finite().nonnegative().nullable(),
    bounds: routeBoundsSchema,
    sourceHash: z.string().min(1),
  })
  .strict();

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use an ISO date (YYYY-MM-DD)");
const isoTime = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use a 24-hour time (HH:mm)");

export const killSchema = z
  .object({
    id: z.string().min(1),
    ownerId: z.string().min(1),
    species: trimmed(120),
    coverMediaId: z.string().min(1).nullable(),
    media: z.array(mediaAssetSchema).max(30),
    country: trimmed(100),
    date: isoDate,
    killTime: isoTime,
    location: killLocationSchema,
    weapon: weaponSchema,
    ammunition: ammunitionSchema,
    loadoutId: z.string().min(1).optional(),
    equipmentAttachments: equipmentAttachmentsSchema.optional(),
    measurement: measurementSchema.optional(),
    route: routeMetadataSchema.nullable(),
    description: z.string().trim().max(5_000),
    status: z.enum(["draft", "active", "trashed"]),
    isPublic: z.boolean().optional(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
    trashedAt: z.string().datetime().nullable(),
  })
  .strict()
  .superRefine((kill, context) => {
    const expectedMediaPrefix = `users/${kill.ownerId}/kills/${kill.id}/media/`;
    for (const [index, asset] of kill.media.entries()) {
      if (!asset.storagePath.startsWith(expectedMediaPrefix)) {
        context.addIssue({
          code: "custom",
          path: ["media", index, "storagePath"],
          message: "Media must belong to this owner and kill record",
        });
      }
    }

    if (
      kill.route &&
      !kill.route.storagePath.startsWith(
        `users/${kill.ownerId}/kills/${kill.id}/routes/`,
      )
    ) {
      context.addIssue({
        code: "custom",
        path: ["route", "storagePath"],
        message: "Route must belong to this owner and kill record",
      });
    }

    if (kill.status === "active" && !kill.coverMediaId) {
      context.addIssue({
        code: "custom",
        path: ["coverMediaId"],
        message: "An active kill requires a cover photo",
      });
    }

    if (
      kill.coverMediaId &&
      !kill.media.some((asset) => asset.id === kill.coverMediaId)
    ) {
      context.addIssue({
        code: "custom",
        path: ["coverMediaId"],
        message: "Cover photo must reference attached media",
      });
    }

    if (kill.status === "trashed" && !kill.trashedAt) {
      context.addIssue({
        code: "custom",
        path: ["trashedAt"],
        message: "A trashed record requires a trash timestamp",
      });
    }
  });

export type MediaAsset = z.infer<typeof mediaAssetSchema>;
export type KillLocation = z.infer<typeof killLocationSchema>;
export type Weapon = z.infer<typeof weaponSchema>;
export type Ammunition = z.infer<typeof ammunitionSchema>;
export type Measurement = z.infer<typeof measurementSchema>;
export type RouteBounds = z.infer<typeof routeBoundsSchema>;
export type RouteMetadata = z.infer<typeof routeMetadataSchema>;
export type Kill = z.infer<typeof killSchema>;
export type KillStatus = Kill["status"];
