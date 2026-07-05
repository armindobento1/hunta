import { collection, doc, onSnapshot, Timestamp, writeBatch, type Unsubscribe } from "firebase/firestore";

import { getFirebaseServices } from "./config";

export async function followAccount(followerId: string, followedId: string) {
  if (followerId === followedId) return;
  const db = getFirebaseServices().db;
  const edge = { followerId, followedId, createdAt: Timestamp.now() };
  const batch = writeBatch(db);
  batch.set(doc(db, "users", followerId, "following", followedId), edge);
  batch.set(doc(db, "publicFollowers", followedId, "followers", followerId), edge);
  await batch.commit();
}

export async function unfollowAccount(followerId: string, followedId: string) {
  const db = getFirebaseServices().db;
  const batch = writeBatch(db);
  batch.delete(doc(db, "users", followerId, "following", followedId));
  batch.delete(doc(db, "publicFollowers", followedId, "followers", followerId));
  await batch.commit();
}

export function subscribeToFollowing(uid: string, onValue: (ids: string[]) => void, onError: (error: Error) => void): Unsubscribe {
  return onSnapshot(collection(getFirebaseServices().db, "users", uid, "following"), (snapshot) => onValue(snapshot.docs.map((entry) => entry.id)), onError);
}
