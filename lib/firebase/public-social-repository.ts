import { collection, collectionGroup, deleteDoc, doc, endAt, getDoc, getDocs, limit, onSnapshot, orderBy, query, runTransaction, setDoc, startAt, Timestamp, where, writeBatch, type Unsubscribe } from "firebase/firestore";

import { publicHuntSchema, publicProfileSchema, type PublicHunt, type PublicProfile } from "@/lib/domain/public-social";
import { getFirebaseServices } from "./config";

const db = () => getFirebaseServices().db;
const profiles = () => collection(db(), "publicProfiles");
const hunts = () => collection(db(), "publicHunts");
const date = (value: unknown) => typeof value === "string" ? value : (value as { toDate(): Date }).toDate().toISOString();
const parseProfile = (value: Record<string, unknown>) => publicProfileSchema.parse({ ...value, createdAt: date(value.createdAt), updatedAt: date(value.updatedAt) });
const parseHunt = (value: Record<string, unknown>) => publicHuntSchema.parse({ ...value, publishedAt: date(value.publishedAt), updatedAt: date(value.updatedAt) });
// Feed/list reads skip documents that fail the schema instead of throwing:
// hunts published before the location redaction (they still carry exact
// coordinates) must never render, and one bad community doc must not take
// down everyone's feed. They stay hidden until the owner republishes or an
// admin migration sanitizes them.
function parseHuntOrSkip(id: string, value: Record<string, unknown>): PublicHunt | null {
  try {
    return parseHunt(value);
  } catch {
    console.warn(`Skipping public hunt ${id}: pre-redaction or invalid shape.`);
    return null;
  }
}
const parseHunts = (docs: Array<{ id: string; data(): Record<string, unknown> }>) =>
  docs.flatMap((entry) => parseHuntOrSkip(entry.id, entry.data()) ?? []);

export async function savePublicProfile(profile: PublicProfile) {
  const value = publicProfileSchema.parse(profile);
  await setDoc(doc(profiles(), value.id), { ...value, createdAt: Timestamp.fromDate(new Date(value.createdAt)), updatedAt: Timestamp.fromDate(new Date(value.updatedAt)) });
}

export async function publishHunt(hunt: PublicHunt) {
  const value = publicHuntSchema.parse(hunt);
  const ref = doc(hunts(), value.id);
  const payload = { ...value, publishedAt: Timestamp.fromDate(new Date(value.publishedAt)), updatedAt: Timestamp.fromDate(new Date(value.updatedAt)) };
  // Preserve accumulated like/comment counts across an owner edit — a full
  // overwrite would otherwise reset them. The transaction avoids a race with a
  // concurrent like/comment increment.
  await runTransaction(db(), async (tx) => {
    const snap = await tx.get(ref);
    const counts = snap.exists()
      ? { likeCount: snap.data().likeCount ?? 0, commentCount: snap.data().commentCount ?? 0 }
      : {};
    tx.set(ref, { ...payload, ...counts });
  });
}

// One collection-group listener for every hunt the viewer has liked — the
// feed reads "did I like this" from this set instead of opening a likes
// listener per card.
export function subscribeToLikedHuntIds(uid: string, onValue: (huntIds: string[]) => void, onError: (error: Error) => void): Unsubscribe {
  return onSnapshot(
    query(collectionGroup(db(), "likes"), where("likerId", "==", uid)),
    (snapshot) => onValue(snapshot.docs.map((entry) => entry.data().huntId as string)),
    onError,
  );
}

export async function unpublishHunt(ownerId: string, killId: string) {
  const huntId = `${ownerId}_${killId}`;
  // Clear likes and comments while the hunt still exists (the owner-moderation
  // rules need the parent document) so nothing resurfaces on a re-publish.
  const [likeDocs, commentDocs] = await Promise.all([
    getDocs(collection(db(), "publicHunts", huntId, "likes")),
    getDocs(collection(db(), "publicHunts", huntId, "comments")),
  ]);
  const batch = writeBatch(db());
  for (const entry of [...likeDocs.docs, ...commentDocs.docs]) batch.delete(entry.ref);
  await batch.commit();
  await deleteDoc(doc(hunts(), huntId));
}

export async function searchPublicProfiles(searchName: string): Promise<PublicProfile[]> {
  const snapshot = await getDocs(query(profiles(), orderBy("searchName"), startAt(searchName), endAt(`${searchName}\uf8ff`), limit(12)));
  return snapshot.docs.map((entry) => parseProfile(entry.data()));
}

export async function getPublicProfile(uid: string): Promise<PublicProfile | null> { const snapshot = await getDoc(doc(profiles(), uid)); return snapshot.exists() ? parseProfile(snapshot.data()) : null; }
export async function getPublicHunt(id: string): Promise<PublicHunt | null> { const snapshot = await getDoc(doc(hunts(), id)); return snapshot.exists() ? parseHuntOrSkip(snapshot.id, snapshot.data()) : null; }
export async function getPublicHuntsByOwner(uid: string): Promise<PublicHunt[]> { const snapshot = await getDocs(query(hunts(), where("ownerId", "==", uid), orderBy("date", "desc"), limit(100))); return parseHunts(snapshot.docs); }

/**
 * Original publication timestamp of an existing projection, read without the
 * full schema so a pre-redaction document still yields it. Rules pin
 * `publishedAt` as immutable, so republishing an edit must reuse this value.
 */
export async function getPublishedAt(ownerId: string, killId: string): Promise<string | null> {
  const snapshot = await getDoc(doc(hunts(), `${ownerId}_${killId}`));
  if (!snapshot.exists()) return null;
  try {
    return date(snapshot.data().publishedAt);
  } catch {
    return null;
  }
}

export function subscribeToPublicHunts(onValue: (hunts: PublicHunt[]) => void, onError: (error: Error) => void, ownerId?: string): Unsubscribe {
  const constraints = ownerId ? [where("ownerId", "==", ownerId), orderBy("date", "desc"), limit(100)] : [orderBy("date", "desc"), limit(100)];
  return onSnapshot(query(hunts(), ...constraints), (snapshot) => onValue(parseHunts(snapshot.docs)), onError);
}

export function subscribeToPublicProfile(uid: string, onValue: (profile: PublicProfile | null) => void, onError: (error: Error) => void): Unsubscribe {
  return onSnapshot(doc(profiles(), uid), (snapshot) => onValue(snapshot.exists() ? parseProfile(snapshot.data()) : null), onError);
}
