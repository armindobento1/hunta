import { collection, collectionGroup, doc, getCountFromServer, getDocs, onSnapshot, query, Timestamp, where, writeBatch, type Unsubscribe } from "firebase/firestore";

import { buildFollowNotification, followNotificationId } from "@/lib/domain/engagement";
import { getFirebaseServices } from "./config";
import { getPublicProfile } from "./public-social-repository";

export type FollowPerson = { id: string; displayName: string; avatarUrl: string | null };

export async function followAccount(followerId: string, followedId: string) {
  if (followerId === followedId) return;
  const db = getFirebaseServices().db;
  const profile = await getPublicProfile(followerId);
  const notification = buildFollowNotification({ id: followerId, name: profile?.displayName ?? "A hunter" }, followedId);
  const edge = { followerId, followedId, createdAt: Timestamp.now() };
  const batch = writeBatch(db);
  batch.set(doc(db, "users", followerId, "following", followedId), edge);
  batch.set(doc(db, "publicFollowers", followedId, "followers", followerId), edge);
  batch.set(doc(db, "users", followedId, "notifications", notification.id), {
    ...notification, createdAt: Timestamp.fromDate(new Date(notification.createdAt)), readAt: null,
  });
  await batch.commit();
}

export async function unfollowAccount(followerId: string, followedId: string) {
  const db = getFirebaseServices().db;
  const batch = writeBatch(db);
  batch.delete(doc(db, "users", followerId, "following", followedId));
  batch.delete(doc(db, "publicFollowers", followedId, "followers", followerId));
  batch.delete(doc(db, "users", followedId, "notifications", followNotificationId(followerId)));
  await batch.commit();
}

export function subscribeToFollowing(uid: string, onValue: (ids: string[]) => void, onError: (error: Error) => void): Unsubscribe {
  return onSnapshot(collection(getFirebaseServices().db, "users", uid, "following"), (snapshot) => onValue(snapshot.docs.map((entry) => entry.id)), onError);
}

// Following is derived from the public follow edges via a collection-group
// query (publicFollowers/*/followers where followerId == uid), so anyone's
// profile can show it — the private users/{uid}/following copy stays private.
const followingEdges = (uid: string) =>
  query(collectionGroup(getFirebaseServices().db, "followers"), where("followerId", "==", uid));

export async function getFollowCounts(uid: string): Promise<{ followers: number; following: number }> {
  const db = getFirebaseServices().db;
  const [followers, following] = await Promise.all([
    getCountFromServer(collection(db, "publicFollowers", uid, "followers")),
    getCountFromServer(followingEdges(uid)),
  ]);
  return { followers: followers.data().count, following: following.data().count };
}

async function resolvePeople(ids: string[]): Promise<FollowPerson[]> {
  const profiles = await Promise.all(ids.map((id) => getPublicProfile(id)));
  return ids.map((id, index) => ({ id, displayName: profiles[index]?.displayName ?? "Hunter", avatarUrl: profiles[index]?.avatarUrl ?? null }));
}

export async function listFollowers(uid: string): Promise<FollowPerson[]> {
  const snapshot = await getDocs(collection(getFirebaseServices().db, "publicFollowers", uid, "followers"));
  return resolvePeople(snapshot.docs.map((entry) => entry.id));
}

export async function listFollowing(uid: string): Promise<FollowPerson[]> {
  const snapshot = await getDocs(followingEdges(uid));
  return resolvePeople(snapshot.docs.map((entry) => (entry.data() as { followedId: string }).followedId));
}
