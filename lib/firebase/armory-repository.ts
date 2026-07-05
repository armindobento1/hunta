import { collection, deleteDoc, doc, getDocs, onSnapshot, setDoc, Timestamp, writeBatch, type Unsubscribe } from "firebase/firestore";

import { armoryItemSchema, loadoutSchema, type ArmoryItem, type Loadout } from "@/lib/domain/armory";
import { getFirebaseServices } from "./config";

function serialize<T extends { createdAt: string; updatedAt: string }>(value: T) {
  return { ...value, createdAt: Timestamp.fromDate(new Date(value.createdAt)), updatedAt: Timestamp.fromDate(new Date(value.updatedAt)) };
}
function deserialize<T>(value: Record<string, unknown>, parse: (input: unknown) => T): T {
  const date = (input: unknown) => typeof input === "string" ? input : (input as { toDate(): Date }).toDate().toISOString();
  return parse({ ...value, createdAt: date(value.createdAt), updatedAt: date(value.updatedAt) });
}
const itemCollection = (uid: string) => collection(getFirebaseServices().db, "users", uid, "armoryItems");
const loadoutCollection = (uid: string) => collection(getFirebaseServices().db, "users", uid, "loadouts");

export async function saveArmoryItem(item: ArmoryItem) {
  const parsed = armoryItemSchema.parse(item);
  await setDoc(doc(itemCollection(parsed.ownerId), parsed.id), serialize(parsed));
}
export async function saveLoadout(loadout: Loadout) {
  const parsed = loadoutSchema.parse(loadout);
  await setDoc(doc(loadoutCollection(parsed.ownerId), parsed.id), serialize(parsed));
}
export function subscribeToArmoryItems(uid: string, onValue: (items: ArmoryItem[]) => void, onError: (error: Error) => void): Unsubscribe {
  return onSnapshot(itemCollection(uid), (snapshot) => onValue(snapshot.docs.map((item) => deserialize(item.data(), (value) => armoryItemSchema.parse(value)))), onError);
}
export function subscribeToLoadouts(uid: string, onValue: (loadouts: Loadout[]) => void, onError: (error: Error) => void): Unsubscribe {
  return onSnapshot(loadoutCollection(uid), (snapshot) => onValue(snapshot.docs.map((item) => deserialize(item.data(), (value) => loadoutSchema.parse(value)))), onError);
}
export async function setDefaultLoadout(uid: string, loadoutId: string) {
  const snapshot = await getDocs(loadoutCollection(uid));
  const batch = writeBatch(getFirebaseServices().db);
  for (const item of snapshot.docs) batch.update(item.ref, { isDefault: item.id === loadoutId, updatedAt: Timestamp.now() });
  await batch.commit();
}
export async function deleteLoadout(uid: string, loadoutId: string) {
  await deleteDoc(doc(loadoutCollection(uid), loadoutId));
}
export async function deleteArmoryItem(uid: string, itemId: string) {
  const snapshot = await getDocs(loadoutCollection(uid));
  const referenced = snapshot.docs.some((entry) => {
    const data = entry.data();
    return data.weaponId === itemId || Object.values((data.slots as Record<string, unknown>) ?? {}).includes(itemId);
  });
  if (referenced) throw new Error("Remove this item from its loadouts before deleting it.");
  await deleteDoc(doc(itemCollection(uid), itemId));
}
