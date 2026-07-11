import { Heart, Trash2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";

import type { HuntComment, HuntLike } from "@/lib/domain/engagement";
import type { PublicHunt } from "@/lib/domain/public-social";
import { useHuntEngagement, type HuntEngagementState } from "@/lib/hooks/use-engagement";
import { initials } from "@/lib/ui/initials";
import { relativeTime } from "@/lib/ui/relative-time";

function likeSummary(likes: HuntLike[], viewerId: string | null): string {
  const others = likes.filter((like) => like.likerId !== viewerId);
  const names = [
    ...(likes.length > others.length ? ["you"] : []),
    ...others.slice(0, 2).map((like) => like.likerName.split(/\s+/)[0]),
  ];
  const rest = others.length - Math.min(others.length, 2);
  return rest > 0 ? `${names.join(", ")} and ${rest} other${rest > 1 ? "s" : ""}` : names.join(" and ");
}

function CommentLikeColumn({ comment, viewerId, onToggle }: {
  comment: HuntComment;
  viewerId: string | null;
  onToggle(comment: HuntComment): void;
}) {
  const count = comment.likedBy?.length ?? 0;
  const liked = Boolean(viewerId && comment.likedBy?.includes(viewerId));
  return (
    <button
      type="button"
      className={`cmt-like-col${liked ? " cmt-liked-col" : ""}`}
      disabled={!viewerId}
      aria-pressed={liked}
      aria-label={liked ? "Unlike comment" : "Like comment"}
      onClick={() => onToggle(comment)}
    >
      <Heart aria-hidden="true" />
      {count > 0 ? <span>{count}</span> : null}
    </button>
  );
}

function CommentBody({ comment, hunt, small = false }: { comment: HuntComment; hunt: PublicHunt; small?: boolean }) {
  return (
    <div className="cmt-text" style={small ? { fontSize: "12.5px" } : undefined}>
      <b>{comment.authorName}</b>
      {comment.authorId === hunt.ownerId ? <span className="cmt-author-chip">AUTHOR</span> : null}
      &nbsp; {comment.body}
    </div>
  );
}

function CommentMeta({ comment, viewerId, hunt, onReply, onDelete }: {
  comment: HuntComment;
  viewerId: string | null;
  hunt: PublicHunt;
  onReply(comment: HuntComment): void;
  onDelete(comment: HuntComment): void;
}) {
  const canDelete = viewerId === comment.authorId || viewerId === hunt.ownerId;
  return (
    <div className="cmt-meta">
      {relativeTime(comment.createdAt)}
      {viewerId ? <button type="button" onClick={() => onReply(comment)}>Reply</button> : null}
      {canDelete ? (
        <button type="button" onClick={() => onDelete(comment)}>
          <Trash2 aria-hidden="true" /> Delete
        </button>
      ) : null}
    </div>
  );
}

/** Likes facepile + threaded comments + sticky composer (design 2d). */
export function CommentSection({ hunt, engagement }: { hunt: PublicHunt; engagement: HuntEngagementState }) {
  const { likes, comments, likedByMe, viewerId, error, toggleLike, addComment, removeComment, toggleCommentLike } = engagement;
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [replyTo, setReplyTo] = useState<HuntComment | null>(null);
  const roots = comments.filter((comment) => !comment.parentId || !comments.some((parent) => parent.id === comment.parentId));
  const repliesOf = (id: string) => comments.filter((comment) => comment.parentId === id);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!body.trim()) return;
    setBusy(true);
    try {
      // Replies attach to the root comment (single-level threading, like IG).
      if (await addComment(body, replyTo ? (replyTo.parentId ?? replyTo.id) : undefined)) {
        setBody("");
        setReplyTo(null);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <section aria-label="Likes and comments">
      <div className="cmt-likerow">
        {likes.length > 0 ? (
          <span className="facepile" aria-hidden="true">
            {likes.slice(0, 3).map((like) => <span key={like.likerId}>{initials(like.likerName)}</span>)}
          </span>
        ) : null}
        <span style={{ flex: 1 }}>
          <b>{likes.length} like{likes.length === 1 ? "" : "s"}</b>
          {likes.length > 0 ? <span className="cmt-likerow-names"> · {likeSummary(likes, viewerId)}</span> : null}
        </span>
        <button
          type="button"
          className={likedByMe ? "cmt-liked" : undefined}
          disabled={!viewerId}
          aria-pressed={likedByMe}
          aria-label={likedByMe ? "Unlike" : "Like"}
          onClick={() => void toggleLike()}
        >
          <Heart aria-hidden="true" fill={likedByMe ? "currentColor" : "none"} />
        </button>
      </div>
      <div className="cmt-section-head">COMMENTS · {comments.length}</div>
      {error ? <p role="alert" style={{ padding: "0 16px" }}>{error}</p> : null}
      {comments.length === 0 ? (
        <p className="soc-viewall" style={{ padding: "8px 16px 14px" }}>No comments yet — be the first.</p>
      ) : (
        roots.map((comment) => (
          <div className="cmt-row" key={comment.id}>
            <span className="cmt-avatar" aria-hidden="true">{initials(comment.authorName)}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <CommentBody comment={comment} hunt={hunt} />
              <CommentMeta comment={comment} viewerId={viewerId} hunt={hunt} onReply={setReplyTo} onDelete={(target) => void removeComment(target)} />
              {repliesOf(comment.id).map((reply) => (
                <div className="cmt-reply-row" key={reply.id}>
                  <span className="cmt-avatar" aria-hidden="true">{initials(reply.authorName)}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <CommentBody comment={reply} hunt={hunt} small />
                    <CommentMeta comment={reply} viewerId={viewerId} hunt={hunt} onReply={() => setReplyTo(reply)} onDelete={(target) => void removeComment(target)} />
                  </div>
                  <CommentLikeColumn comment={reply} viewerId={viewerId} onToggle={(target) => void toggleCommentLike(target)} />
                </div>
              ))}
            </div>
            <CommentLikeColumn comment={comment} viewerId={viewerId} onToggle={(target) => void toggleCommentLike(target)} />
          </div>
        ))
      )}
      <div className="cmt-composer">
        {viewerId ? (
          <>
            {replyTo ? (
              <div className="cmt-replying">
                Replying to <b>{replyTo.authorName}</b>
                <button type="button" aria-label="Cancel reply" onClick={() => setReplyTo(null)}>×</button>
              </div>
            ) : null}
            <form className="cmt-composer-row" onSubmit={submit}>
              <input
                className="cmt-input"
                value={body}
                maxLength={1000}
                placeholder={replyTo ? `Reply to ${replyTo.authorName}…` : "Add a comment…"}
                onChange={(event) => setBody(event.target.value)}
              />
              <button type="submit" className="cmt-post" disabled={busy || !body.trim()}>Post</button>
            </form>
          </>
        ) : (
          <div className="cmt-signin">Sign in to like and comment&nbsp;<Link to="/auth">Sign in</Link></div>
        )}
      </div>
    </section>
  );
}

/** Standalone comments screen (linked from feed cards). */
export function HuntComments({ hunt }: { hunt: PublicHunt }) {
  const navigate = useNavigate();
  const engagement = useHuntEngagement(hunt);
  const cover = hunt.media.find((media) => media.id === hunt.coverMediaId && media.kind === "photo");
  return (
    <main className="cmt-shell">
      <div className="cmt-head">
        <button type="button" className="cmt-back" aria-label="Back" onClick={() => navigate(-1)} />
        <span className="cmt-title">Comments</span>
        <span className="cmt-context">
          {cover ? <img src={cover.downloadUrl} alt="" /> : null}
          <span>{hunt.species}<br />{hunt.location.farmName || hunt.location.placeName}</span>
        </span>
      </div>
      <CommentSection hunt={hunt} engagement={engagement} />
    </main>
  );
}
