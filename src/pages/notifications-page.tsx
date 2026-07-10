import { Bell } from "lucide-react";
import { Link } from "react-router-dom";

import { BottomNav } from "@/components/portfolio/bottom-nav";
import { notificationText, type SocialNotification } from "@/lib/domain/engagement";
import { useAuth } from "@/lib/hooks/use-auth";
import { useNotifications } from "@/lib/hooks/use-notifications";

function target(entry: SocialNotification, viewerUid: string): string {
  return entry.type === "follow" ? `/people/${entry.actorId}` : `/people/${viewerUid}/hunts/${entry.huntId}`;
}

export function NotificationsPage() {
  const { user } = useAuth();
  const { notifications, unreadCount, error, markRead } = useNotifications();

  return (
    <main className="notifications-page">
      <header className="section-title-row">
        <div>
          <p className="mono-label">ACTIVITY</p>
          <h1>Notifications</h1>
        </div>
        {unreadCount ? <span className="unread-count">{unreadCount} new</span> : null}
      </header>
      {error ? <p role="alert">{error}</p> : null}
      {notifications.length === 0 ? (
        <div className="centered-state">
          <Bell aria-hidden="true" />
          <p>No activity yet. Follows, likes, and comments show up here.</p>
        </div>
      ) : (
        <ul className="notification-list">
          {notifications.map((entry) => (
            <li key={entry.id} className={entry.readAt ? "notification-read" : "notification-unread"}>
              <Link to={target(entry, user?.uid ?? "")} onClick={() => { if (!entry.readAt) markRead(entry.id); }}>
                <strong>{entry.actorName}</strong> {notificationText(entry)}
                {entry.preview ? <span className="notification-preview">“{entry.preview}”</span> : null}
              </Link>
            </li>
          ))}
        </ul>
      )}
      <BottomNav />
    </main>
  );
}
