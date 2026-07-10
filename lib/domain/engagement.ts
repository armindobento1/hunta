import { z } from "zod";

import type { PublicHunt } from "./public-social";

const trimmed = (max: number) => z.string().trim().min(1).max(max);

export const huntLikeSchema = z.object({
  huntId: z.string().min(1),
  likerId: z.string().min(1),
  likerName: trimmed(80),
  createdAt: z.string().datetime(),
}).strict();

export const huntCommentSchema = z.object({
  id: z.string().min(1),
  huntId: z.string().min(1),
  authorId: z.string().min(1),
  authorName: trimmed(80),
  body: trimmed(1_000),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
}).strict();

export const notificationSchema = z.object({
  id: z.string().min(1),
  recipientId: z.string().min(1),
  actorId: z.string().min(1),
  actorName: trimmed(80),
  type: z.enum(["follow", "like", "comment"]),
  huntId: z.string().min(1).max(128).optional(),
  huntSpecies: z.string().trim().min(1).max(120).optional(),
  commentId: z.string().min(1).max(128).optional(),
  preview: z.string().trim().min(1).max(140).optional(),
  createdAt: z.string().datetime(),
  readAt: z.string().datetime().nullable(),
}).strict().superRefine((value, context) => {
  if (value.type !== "follow" && !value.huntId) {
    context.addIssue({ code: "custom", path: ["huntId"], message: "Hunt notifications must reference the hunt" });
  }
  if (value.type === "comment" && !value.commentId) {
    context.addIssue({ code: "custom", path: ["commentId"], message: "Comment notifications must reference the comment" });
  }
});

export type HuntLike = z.infer<typeof huntLikeSchema>;
export type HuntComment = z.infer<typeof huntCommentSchema>;
export type SocialNotification = z.infer<typeof notificationSchema>;
export type Actor = { id: string; name: string };

// Deterministic ids: re-liking or re-following never duplicates a
// notification, and unlike/unfollow can retract exactly the one it created.
export const followNotificationId = (actorId: string) => `follow_${actorId}`;
export const likeNotificationId = (actorId: string, huntId: string) => `like_${actorId}_${huntId}`;
export const commentNotificationId = (commentId: string) => `comment_${commentId}`;

export function buildFollowNotification(actor: Actor, recipientId: string, createdAt = new Date().toISOString()): SocialNotification {
  return notificationSchema.parse({
    id: followNotificationId(actor.id), recipientId, actorId: actor.id, actorName: actor.name,
    type: "follow", createdAt, readAt: null,
  });
}

export function buildLikeNotification(actor: Actor, hunt: PublicHunt, createdAt = new Date().toISOString()): SocialNotification {
  return notificationSchema.parse({
    id: likeNotificationId(actor.id, hunt.id), recipientId: hunt.ownerId, actorId: actor.id, actorName: actor.name,
    type: "like", huntId: hunt.id, huntSpecies: hunt.species, createdAt, readAt: null,
  });
}

export function buildCommentNotification(actor: Actor, hunt: PublicHunt, comment: HuntComment, createdAt = new Date().toISOString()): SocialNotification {
  return notificationSchema.parse({
    id: commentNotificationId(comment.id), recipientId: hunt.ownerId, actorId: actor.id, actorName: actor.name,
    type: "comment", huntId: hunt.id, huntSpecies: hunt.species, commentId: comment.id,
    preview: comment.body.slice(0, 140).trim(), createdAt, readAt: null,
  });
}

export function notificationText(notification: SocialNotification): string {
  if (notification.type === "follow") return "started following you";
  const subject = notification.huntSpecies ? `your ${notification.huntSpecies} hunt` : "your hunt";
  return notification.type === "like" ? `liked ${subject}` : `commented on ${subject}`;
}
