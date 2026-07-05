import { collection, deleteDoc, doc, endAt, getDoc, getDocs, limit, onSnapshot, orderBy, query, setDoc, startAt, Timestamp, where, type Unsubscribe } from "firebase/firestore";

import { publicHuntSchema, publicProfileSchema, type PublicHunt, type PublicProfile } from "@/lib/domain/public-social";
import { getFirebaseServices } from "./config";

const db = () => getFirebaseServices().db;
const profiles = () => collection(db(), "publicProfiles");
const hunts = () => collection(db(), "publicHunts");
const date = (value: unknown) => typeof value === "string" ? value : (value as { toDate(): Date }).toDate().toISOString();
const parseProfile = (value: Record<string, unknown>) => publicProfileSchema.parse({ ...value, createdAt: date(value.createdAt), updatedAt: date(value.updatedAt) });
const parseHunt = (value: Record<string, unknown>) => publicHuntSchema.parse({ ...value, publishedAt: date(value.publishedAt), updatedAt: date(value.updatedAt) });

export async function savePublicProfile(profile: PublicProfile) {
  const value = publicProfileSchema.parse(profile);
  await setDoc(doc(profiles(), value.id), { ...value, createdAt: Timestamp.fromDate(new Date(value.createdAt)), updatedAt: Timestamp.fromDate(new Date(value.updatedAt)) });
}

export async function publishHunt(hunt: PublicHunt) {
  const value = publicHuntSchema.parse(hunt);
  await setDoc(doc(hunts(), value.id), { ...value, publishedAt: Timestamp.fromDate(new Date(value.publishedAt)), updatedAt: Timestamp.fromDate(new Date(value.updatedAt)) });
}

export async function unpublishHunt(ownerId: string, killId: string) {
  await deleteDoc(doc(hunts(), `${ownerId}_${killId}`));
}

export async function searchPublicProfiles(searchName: string): Promise<PublicProfile[]> {
  const snapshot = await getDocs(query(profiles(), orderBy("searchName"), startAt(searchName), endAt(`${searchName}\uf8ff`), limit(12)));
  return snapshot.docs.map((entry) => parseProfile(entry.data()));
}

export async function getPublicProfile(uid: string): Promise<PublicProfile | null> { const snapshot = await getDoc(doc(profiles(), uid)); return snapshot.exists() ? parseProfile(snapshot.data()) : null; }
export async function getPublicHunt(id: string): Promise<PublicHunt | null> { const snapshot = await getDoc(doc(hunts(), id)); return snapshot.exists() ? parseHunt(snapshot.data()) : null; }
export async function getPublicHuntsByOwner(uid: string): Promise<PublicHunt[]> { const snapshot = await getDocs(query(hunts(), where("ownerId", "==", uid), orderBy("date", "desc"), limit(100))); return snapshot.docs.map((entry) => parseHunt(entry.data())); }

export function subscribeToPublicHunts(onValue: (hunts: PublicHunt[]) => void, onError: (error: Error) => void, ownerId?: string): Unsubscribe {
  const constraints = ownerId ? [where("ownerId", "==", ownerId), orderBy("date", "desc"), limit(100)] : [orderBy("date", "desc"), limit(100)];
  return onSnapshot(query(hunts(), ...constraints), (snapshot) => onValue(snapshot.docs.map((entry) => parseHunt(entry.data()))), onError);
}

export function subscribeToPublicProfile(uid: string, onValue: (profile: PublicProfile | null) => void, onError: (error: Error) => void): Unsubscribe {
  return onSnapshot(doc(profiles(), uid), (snapshot) => onValue(snapshot.exists() ? parseProfile(snapshot.data()) : null), onError);
}
