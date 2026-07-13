import { arrayRemove, arrayUnion, collection, deleteDoc, doc, increment, limit, onSnapshot, orderBy, query, Timestamp, updateDoc, writeBatch, type Unsubscribe } from "firebase/firestore";

import {
  buildCommentNotification, buildLikeNotification, commentNotificationId, huntCommentSchema, huntLikeSchema,
  likeNotificationId, notificationSchema, type Actor, type HuntComment, type HuntLike, type SocialNotification,
} from "@/lib/domain/engagement";
import type { PublicHunt } from "@/lib/domain/public-social";
import { getFirebaseServices } from "./config";

const db = () => getFirebaseServices().db;
const huntDoc = (huntId: string) => doc(db(), "publicHunts", huntId);
const likes = (huntId: string) => collection(db(), "publicHunts", huntId, "likes");
const comments = (huntId: string) => collection(db(), "publicHunts", huntId, "comments");
const notifications = (uid: string) => collection(db(), "users", uid, "notifications");
const commentId = () => globalThis.crypto?.randomUUID?.() ?? `comment-${Date.now()}`;

const ts = (iso: string) => Timestamp.fromDate(new Date(iso));
const date = (value: unknown) => typeof value === "string" ? value : (value as { toDate(): Date }).toDate().toISOString();

const serializeNotification = (value: SocialNotification) =>
  ({ ...value, createdAt: ts(value.createdAt), readAt: value.readAt ? ts(value.readAt) : null });

export async function likeHunt(hunt: PublicHunt, actor: Actor) {
  const like = huntLikeSchema.parse({ huntId: hunt.id, likerId: actor.id, likerName: actor.name, createdAt: new Date().toISOString() });
  const batch = writeBatch(db());
  batch.set(doc(likes(hunt.id), actor.id), { ...like, createdAt: ts(like.createdAt) });
  batch.update(huntDoc(hunt.id), { likeCount: increment(1) });
  if (hunt.ownerId !== actor.id) {
    const notification = buildLikeNotification(actor, hunt, like.createdAt);
    batch.set(doc(notifications(hunt.ownerId), notification.id), serializeNotification(notification));
  }
  await batch.commit();
}

export async function unlikeHunt(hunt: PublicHunt, actorId: string) {
  const batch = writeBatch(db());
  batch.delete(doc(likes(hunt.id), actorId));
  batch.update(huntDoc(hunt.id), { likeCount: increment(-1) });
  if (hunt.ownerId !== actorId) batch.delete(doc(notifications(hunt.ownerId), likeNotificationId(actorId, hunt.id)));
  await batch.commit();
}

export async function addHuntComment(hunt: PublicHunt, actor: Actor, body: string, parentId?: string): Promise<HuntComment> {
  const now = new Date().toISOString();
  const comment = huntCommentSchema.parse({ id: commentId(), huntId: hunt.id, authorId: actor.id, authorName: actor.name, body, ...(parentId ? { parentId } : {}), likedBy: [], createdAt: now, updatedAt: now });
  const batch = writeBatch(db());
  batch.set(doc(comments(hunt.id), comment.id), { ...comment, createdAt: ts(comment.createdAt), updatedAt: ts(comment.updatedAt) });
  batch.update(huntDoc(hunt.id), { commentCount: increment(1) });
  if (hunt.ownerId !== actor.id) {
    const notification = buildCommentNotification(actor, hunt, comment, now);
    batch.set(doc(notifications(hunt.ownerId), notification.id), serializeNotification(notification));
  }
  await batch.commit();
  return comment;
}

export async function deleteHuntComment(hunt: PublicHunt, comment: HuntComment) {
  const batch = writeBatch(db());
  batch.delete(doc(comments(hunt.id), comment.id));
  batch.update(huntDoc(hunt.id), { commentCount: increment(-1) });
  if (hunt.ownerId !== comment.authorId) batch.delete(doc(notifications(hunt.ownerId), commentNotificationId(comment.id)));
  await batch.commit();
}

export async function setCommentLiked(huntId: string, targetCommentId: string, uid: string, liked: boolean) {
  await updateDoc(doc(comments(huntId), targetCommentId), { likedBy: liked ? arrayUnion(uid) : arrayRemove(uid) });
}

export function subscribeToHuntLikes(huntId: string, onValue: (value: HuntLike[]) => void, onError: (error: Error) => void): Unsubscribe {
  return onSnapshot(query(likes(huntId), limit(500)), (snapshot) => onValue(snapshot.docs.map((entry) => huntLikeSchema.parse({ ...entry.data(), createdAt: date(entry.data().createdAt) }))), onError);
}

export function subscribeToHuntComments(huntId: string, onValue: (value: HuntComment[]) => void, onError: (error: Error) => void): Unsubscribe {
  return onSnapshot(query(comments(huntId), orderBy("createdAt", "asc"), limit(200)), (snapshot) => onValue(snapshot.docs.map((entry) => huntCommentSchema.parse({ ...entry.data(), createdAt: date(entry.data().createdAt), updatedAt: date(entry.data().updatedAt) }))), onError);
}

export function subscribeToNotifications(uid: string, onValue: (value: SocialNotification[]) => void, onError: (error: Error) => void): Unsubscribe {
  return onSnapshot(query(notifications(uid), orderBy("createdAt", "desc"), limit(50)), (snapshot) => onValue(snapshot.docs.map((entry) => notificationSchema.parse({
    ...entry.data(), createdAt: date(entry.data().createdAt), readAt: entry.data().readAt ? date(entry.data().readAt) : null,
  }))), onError);
}

export async function markNotificationRead(uid: string, notificationId: string) {
  await updateDoc(doc(notifications(uid), notificationId), { readAt: Timestamp.now() });
}

export async function deleteNotification(uid: string, notificationId: string) {
  await deleteDoc(doc(notifications(uid), notificationId));
}
