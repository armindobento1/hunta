import { Heart, Trash2 } from "lucide-react";
import { useState, type FormEvent } from "react";

import type { PublicHunt } from "@/lib/domain/public-social";
import { useHuntEngagement } from "@/lib/hooks/use-engagement";

export function HuntEngagement({ hunt }: { hunt: PublicHunt }) {
  const { likes, comments, likedByMe, viewerId, error, toggleLike, addComment, removeComment } = useHuntEngagement(hunt);
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!body.trim()) return;
    setBusy(true);
    try {
      if (await addComment(body)) setBody("");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="hunt-engagement" aria-label="Likes and comments">
      <div className="engagement-row">
        <button
          type="button"
          className={`like-button${likedByMe ? " like-active" : ""}`}
          disabled={!viewerId}
          aria-pressed={likedByMe}
          onClick={() => void toggleLike()}
        >
          <Heart aria-hidden="true" /> {likes.length}
        </button>
        <span className="comment-count">{comments.length} comments</span>
      </div>
      {error ? <p role="alert">{error}</p> : null}
      <ul className="comment-list">
        {comments.map((comment) => (
          <li key={comment.id}>
            <strong>{comment.authorName}</strong>
            <span>{comment.body}</span>
            {viewerId === comment.authorId || viewerId === hunt.ownerId ? (
              <button type="button" aria-label={`Delete comment by ${comment.authorName}`} onClick={() => void removeComment(comment)}>
                <Trash2 aria-hidden="true" />
              </button>
            ) : null}
          </li>
        ))}
      </ul>
      {viewerId ? (
        <form className="comment-form" onSubmit={submit}>
          <input
            value={body}
            maxLength={1000}
            placeholder="Add a comment…"
            onChange={(event) => setBody(event.target.value)}
          />
          <button type="submit" disabled={busy || !body.trim()}>Post</button>
        </form>
      ) : (
        <p className="engagement-signin">Sign in to like and comment.</p>
      )}
    </section>
  );
}
