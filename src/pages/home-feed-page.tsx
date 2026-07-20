import { Bell, Compass, Trophy } from "lucide-react";
import { Link } from "react-router-dom";

import { BrandLogo } from "@/components/brand";
import { BottomNav } from "@/components/portfolio/bottom-nav";
import { HuntPostCard } from "@/components/social/hunt-post-card";
import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/lib/hooks/use-auth";
import { useNotifications } from "@/lib/hooks/use-notifications";
import { useSocial } from "@/lib/hooks/use-social";

export function HomeFeedPage() {
  const { user } = useAuth();
  const { hunts, followingIds, loading, error } = useSocial();
  const { unreadCount } = useNotifications();
  if (!user) return null;
  const feed = hunts.filter(
    (hunt) => hunt.ownerId === user.uid || followingIds.includes(hunt.ownerId),
  );

  return (
    <main className="portfolio-shell">
      <div className="portfolio-content">
        <header className="app-top-bar">
          <span className="app-wordmark-row">
            <BrandLogo size={24} className="app-logo" label="" />
            <span className="app-wordmark">Hunta</span>
          </span>
          <span className="top-bar-actions">
            <Link
              className="top-bar-action top-bar-bell"
              to="/notifications"
              aria-label={unreadCount ? `Notifications, ${unreadCount} unread` : "Notifications"}
            >
              <Bell aria-hidden="true" />
              {unreadCount ? <span className="notif-badge" aria-hidden="true">{unreadCount > 9 ? "9+" : unreadCount}</span> : null}
            </Link>
            <Link
              className="top-bar-action"
              to="/portfolio/leaderboard"
              aria-label="Leaderboard"
            >
              <Trophy aria-hidden="true" />
            </Link>
          </span>
        </header>
        {error ? <p className="social-loading" role="alert">{error}</p> : null}
        {loading ? (
          <div className="centered-state">
            <Spinner label="Loading your feed" />
          </div>
        ) : feed.length === 0 ? (
          <div className="soc-empty">
            <span className="soc-empty-icon"><Compass aria-hidden="true" /></span>
            <strong>Your feed is empty.</strong>
            <p>Follow hunters to see their hunts.</p>
            <Link className="primary-link" to="/discover">
              Find hunters
            </Link>
          </div>
        ) : (
          <div className="social-feed-list">
            {feed.map((hunt, index) => (
              <HuntPostCard key={hunt.id} hunt={hunt} imagePriority={index === 0} />
            ))}
          </div>
        )}
      </div>
      <BottomNav />
    </main>
  );
}
