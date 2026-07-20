import { Link } from "react-router-dom";

import { BottomNav } from "@/components/portfolio/bottom-nav";
import { AccountSearch } from "@/components/social/account-search";
import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/lib/hooks/use-auth";
import { useSocial } from "@/lib/hooks/use-social";

export function DiscoverPage() {
  const { user } = useAuth();
  const { hunts, followingIds, loading, error, toggleFollow } = useSocial();
  if (!user) return null;

  return (
    <main className="portfolio-shell">
      <div className="portfolio-content">
        <div className="discover-head">
          <AccountSearch
            currentUserId={user.uid}
            followingIds={followingIds}
            onToggleFollow={toggleFollow}
          />
        </div>
        {error ? <p className="social-loading" role="alert">{error}</p> : null}
        {loading ? (
          <div className="centered-state">
            <Spinner label="Loading community hunts" />
          </div>
        ) : hunts.length === 0 ? (
          <div className="social-empty">
            <strong>No published hunts yet.</strong>
            <span>Hunts shared by the community will show up here.</span>
          </div>
        ) : (
          <div className="discover-grid" aria-label="Discover hunts">
            {hunts.map((hunt, index) => {
              const cover = hunt.media.find(
                (media) =>
                  media.id === hunt.coverMediaId && media.kind === "photo",
              );
              return (
                <Link
                  className={`discover-tile${cover ? " discover-tile-image" : ""}`}
                  key={hunt.id}
                  to={`/people/${hunt.ownerId}/hunts/${hunt.id}`}
                  aria-label={`${hunt.species} by ${hunt.hunter.displayName}`}
                >
                  {cover ? (
                    <img
                      src={cover.downloadUrl}
                      alt=""
                      loading={index < 6 ? "eager" : "lazy"}
                      fetchPriority={index === 0 ? "high" : "auto"}
                      decoding="async"
                    />
                  ) : <span>{hunt.species}</span>}
                </Link>
              );
            })}
          </div>
        )}
      </div>
      <BottomNav />
    </main>
  );
}
