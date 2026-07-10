import { Link } from "react-router-dom";

import { FollowStats } from "@/components/portfolio/follow-stats";
import type { Profile } from "@/lib/domain/profile";
import type { PortfolioStats } from "@/lib/domain/selectors";

function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export type PortfolioTab = "feed" | "location" | "armory";

export function ProfileHeader({
  profile,
  stats,
  activeTab,
  onTabChange,
}: {
  profile: Profile;
  stats: PortfolioStats;
  activeTab: PortfolioTab;
  onTabChange(tab: PortfolioTab): void;
}) {
  return (
    <header className="profile-section">
      <div className="profile-identity-row">
        {profile.avatarUrl ? (
          <span
            className="ios-avatar"
            role="img"
            aria-label={`${profile.displayName}'s avatar`}
            style={{ backgroundImage: `url(${profile.avatarUrl})` }}
          />
        ) : (
          <span className="ios-avatar ios-avatar-initials" aria-hidden="true">
            {initials(profile.displayName)}
          </span>
        )}
        <div className="profile-name-block">
          <p className="profile-kicker">Private portfolio</p>
          <h1 className="ios-name">{profile.displayName}</h1>
        </div>
        <Link
          className="ios-more-btn"
          to="/portfolio/profile"
          aria-label="Profile settings"
        >
          <span /><span /><span />
        </Link>
      </div>
      {profile.bio ? <p className="ios-bio">{profile.bio}</p> : null}
      <dl className="ios-stats">
        <div>
          <strong className="ios-stat-num">{stats.animals}</strong>
          <dt className="ios-stat-label">Animals</dt>
        </div>
        <span className="ios-stat-sep" aria-hidden="true" />
        <div>
          <strong className="ios-stat-num">{stats.countries}</strong>
          <dt className="ios-stat-label">Countries</dt>
        </div>
        <span className="ios-stat-sep" aria-hidden="true" />
        <div>
          <strong className="ios-stat-num">
            {stats.distanceKm}<span className="ios-stat-unit"> km</span>
          </strong>
          <dt className="ios-stat-label">Walked</dt>
        </div>
      </dl>
      <FollowStats uid={profile.id} />
      <div className="ios-seg" aria-label="Portfolio view">
        {(["feed", "location", "armory"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            className={`ios-seg-btn${activeTab === tab ? " ios-seg-active" : ""}`}
            aria-pressed={activeTab === tab}
            onClick={() => onTabChange(tab)}
          >
            {tab === "feed" ? "Feed" : tab === "location" ? "By location" : "Armory"}
          </button>
        ))}
      </div>
    </header>
  );
}
