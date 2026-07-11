import { collection, doc, getDoc, getDocs, limit, orderBy, query, setDoc, Timestamp, where } from "firebase/firestore";

import { farmSchema, nearbyFarms, type Farm, type FarmSuggestion } from "@/lib/domain/farm";
import { getFirebaseServices } from "./config";

const db = () => getFirebaseServices().db;
const farms = () => collection(db(), "farms");

const date = (value: unknown) =>
  typeof value === "string" ? value : (value as { toDate(): Date }).toDate().toISOString();
const parseFarm = (value: Record<string, unknown>) =>
  farmSchema.parse({ ...value, createdAt: date(value.createdAt), updatedAt: date(value.updatedAt) });

/**
 * Idempotently create the farm entry for a published hunt. An existing farm
 * is never mutated by publishing — first writer sets the public pin.
 */
export async function ensureFarm(farm: Farm): Promise<Farm> {
  const value = farmSchema.parse(farm);
  const ref = doc(farms(), value.id);
  const existing = await getDoc(ref);
  if (existing.exists()) return parseFarm(existing.data());
  await setDoc(ref, {
    ...value,
    createdAt: Timestamp.fromDate(new Date(value.createdAt)),
    updatedAt: Timestamp.fromDate(new Date(value.updatedAt)),
  });
  return value;
}

export async function getFarm(farmId: string): Promise<Farm | null> {
  const snapshot = await getDoc(doc(farms(), farmId));
  return snapshot.exists() ? parseFarm(snapshot.data()) : null;
}

/** Nearby community farms for the kill-form "did you hunt here?" prompt. */
export async function findFarmsNear(
  country: string,
  latitude: number,
  longitude: number,
): Promise<FarmSuggestion[]> {
  const constraints = country.trim()
    ? [where("country", "==", country.trim()), limit(300)]
    : [orderBy("searchName"), limit(300)];
  const snapshot = await getDocs(query(farms(), ...constraints));
  const all = snapshot.docs.map((entry) => parseFarm(entry.data()));
  return nearbyFarms(all, latitude, longitude);
}
