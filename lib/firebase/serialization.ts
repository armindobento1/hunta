import { Timestamp } from "firebase/firestore";

import { killSchema, type Kill } from "@/lib/domain/kill";
import { profileSchema, type Profile } from "@/lib/domain/profile";

type TimestampValue = Timestamp | { toDate(): Date };

function timestampToIso(value: TimestampValue | string): string {
  return typeof value === "string" ? value : value.toDate().toISOString();
}

export function serializeKill(kill: Kill) {
  const parsed = killSchema.parse(kill);
  return {
    ...parsed,
    createdAt: Timestamp.fromDate(new Date(parsed.createdAt)),
    updatedAt: Timestamp.fromDate(new Date(parsed.updatedAt)),
    trashedAt: parsed.trashedAt
      ? Timestamp.fromDate(new Date(parsed.trashedAt))
      : null,
  };
}

export function deserializeKill(data: Record<string, unknown>): Kill {
  return killSchema.parse({
    ...data,
    createdAt: timestampToIso(data.createdAt as TimestampValue | string),
    updatedAt: timestampToIso(data.updatedAt as TimestampValue | string),
    trashedAt: data.trashedAt
      ? timestampToIso(data.trashedAt as TimestampValue | string)
      : null,
  });
}

export function serializeProfile(profile: Profile) {
  const parsed = profileSchema.parse(profile);
  return {
    ...parsed,
    createdAt: Timestamp.fromDate(new Date(parsed.createdAt)),
    updatedAt: Timestamp.fromDate(new Date(parsed.updatedAt)),
  };
}

export function deserializeProfile(data: Record<string, unknown>): Profile {
  return profileSchema.parse({
    ...data,
    createdAt: timestampToIso(data.createdAt as TimestampValue | string),
    updatedAt: timestampToIso(data.updatedAt as TimestampValue | string),
  });
}
