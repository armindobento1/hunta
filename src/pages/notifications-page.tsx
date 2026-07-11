import { Bell } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import { notificationText, type SocialNotification } from "@/lib/domain/engagement";
import { useAuth } from "@/lib/hooks/use-auth";
import { useNotifications } from "@/lib/hooks/use-notifications";
import { initials } from "@/lib/ui/initials";
import { relativeTime } from "@/lib/ui/relative-time";

function target(entry: SocialNotification, viewerUid: string): string {
  return entry.type === "follow" ? `/people/${entry.actorId}` : `/people/${viewerUid}/hunts/${entry.huntId}`;
}

function sectionOf(entry: SocialNotification): "New" | "Today" | "Earlier" {
  if (!entry.readAt) return "New";
  return Date.now() - new Date(entry.createdAt).getTime() < 86_400_000 ? "Today" : "Earlier";
}

const SECTIONS = ["New", "Today", "Earlier"] as const;

export function NotificationsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { notifications, error, markRead } = useNotifications();

  return (
    <main className="act-shell">
      <div className="cmt-head">
        <button type="button" className="cmt-back" aria-label="Back to home" onClick={() => navigate("/home")} />
        <span className="cmt-title">Activity</span>
      </div>
      {error ? <p role="alert" style={{ padding: "0 16px" }}>{error}</p> : null}
      {notifications.length === 0 ? (
        <div className="act-empty">
          <span className="soc-empty-icon"><Bell aria-hidden="true" /></span>
          <strong>Nothing yet</strong>
          <p>Likes, comments and new followers will show up here.</p>
        </div>
      ) : (
        SECTIONS.map((section) => {
          const entries = notifications.filter((entry) => sectionOf(entry) === section);
          if (entries.length === 0) return null;
          return (
            <div key={section}>
              <div className="act-section">{section.toUpperCase()}</div>
              {entries.map((entry) => (
                <Link
                  key={entry.id}
                  className={`act-row${entry.readAt ? "" : " act-unread"}`}
                  to={target(entry, user?.uid ?? "")}
                  onClick={() => { if (!entry.readAt) markRead(entry.id); }}
                >
                  <span className="act-avatar" aria-hidden="true">{initials(entry.actorName)}</span>
                  <span className="act-text">
                    <b>{entry.actorName}</b> {notificationText(entry)}.
                    {entry.preview ? <span className="act-preview"> “{entry.preview}”</span> : null}
                    {" "}
                    <span className="act-time">{relativeTime(entry.createdAt)}</span>
                  </span>
                </Link>
              ))}
            </div>
          );
        })
      )}
    </main>
  );
}
