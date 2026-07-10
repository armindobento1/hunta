import {
  buildCommentNotification, buildFollowNotification, buildLikeNotification, huntCommentSchema, huntLikeSchema,
  notificationSchema, notificationText,
} from "@/lib/domain/engagement";
import type { PublicHunt } from "@/lib/domain/public-social";

const now = "2026-07-10T08:00:00.000Z";
const hunt = { id: "owner_kill-1", ownerId: "owner", species: "Greater Kudu" } as PublicHunt;
const actor = { id: "other", name: "Pieter" };

describe("engagement domain", () => {
  it("validates likes and comments and rejects empty content", () => {
    expect(huntLikeSchema.parse({ huntId: hunt.id, likerId: "other", likerName: "Pieter", createdAt: now }).likerId).toBe("other");
    const comment = { id: "c1", huntId: hunt.id, authorId: "other", authorName: "Pieter", body: "Great kudu.", createdAt: now, updatedAt: now };
    expect(huntCommentSchema.parse(comment).body).toBe("Great kudu.");
    expect(() => huntCommentSchema.parse({ ...comment, body: "  " })).toThrow();
    expect(() => huntLikeSchema.parse({ huntId: hunt.id, likerId: "other", likerName: "Pieter", createdAt: now, extra: true })).toThrow();
  });

  it("builds notifications with deterministic ids and the hunt owner as recipient", () => {
    const follow = buildFollowNotification(actor, "owner", now);
    expect(follow).toMatchObject({ id: "follow_other", recipientId: "owner", type: "follow", readAt: null });

    const like = buildLikeNotification(actor, hunt, now);
    expect(like).toMatchObject({ id: "like_other_owner_kill-1", recipientId: "owner", huntId: hunt.id, huntSpecies: "Greater Kudu" });

    const comment = huntCommentSchema.parse({ id: "c1", huntId: hunt.id, authorId: "other", authorName: "Pieter", body: "x".repeat(300), createdAt: now, updatedAt: now });
    const notification = buildCommentNotification(actor, hunt, comment, now);
    expect(notification.id).toBe("comment_c1");
    expect(notification.preview).toHaveLength(140);
  });

  it("requires hunt context on like and comment notifications", () => {
    expect(() => notificationSchema.parse({
      id: "n1", recipientId: "owner", actorId: "other", actorName: "Pieter", type: "like", createdAt: now, readAt: null,
    })).toThrow(/hunt/i);
    expect(() => notificationSchema.parse({
      id: "n1", recipientId: "owner", actorId: "other", actorName: "Pieter", type: "comment", huntId: hunt.id, createdAt: now, readAt: null,
    })).toThrow(/comment/i);
  });

  it("renders reader-facing notification text", () => {
    expect(notificationText(buildFollowNotification(actor, "owner", now))).toBe("started following you");
    expect(notificationText(buildLikeNotification(actor, hunt, now))).toBe("liked your Greater Kudu hunt");
  });
});
