import { Trophy } from "lucide-react";
import { Link } from "react-router-dom";

import { BrandLogo } from "@/components/brand";
import { BottomNav } from "@/components/portfolio/bottom-nav";
import { HuntPostCard } from "@/components/social/hunt-post-card";
import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/lib/hooks/use-auth";
import { useSocial } from "@/lib/hooks/use-social";

export function HomeFeedPage() {
  const { user } = useAuth();
  const { hunts, followingIds, loading, error } = useSocial();
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
          <Link
            className="top-bar-action"
            to="/portfolio/leaderboard"
            aria-label="Leaderboard"
          >
            <Trophy aria-hidden="true" />
          </Link>
        </header>
        {error ? <p className="social-loading" role="alert">{error}</p> : null}
        {loading ? (
          <div className="centered-state">
            <Spinner label="Loading your feed" />
          </div>
        ) : feed.length === 0 ? (
          <div className="social-empty">
            <strong>Your feed is empty.</strong>
            <span>Follow hunters to see their hunts here as they post.</span>
            <Link className="primary-link" to="/discover">
              Find hunters
            </Link>
          </div>
        ) : (
          <div className="social-feed-list">
            {feed.map((hunt) => (
              <HuntPostCard key={hunt.id} hunt={hunt} />
            ))}
          </div>
        )}
      </div>
      <BottomNav />
    </main>
  );
}
