import type { Profile } from "@/lib/domain/profile";
import type { PortfolioStats } from "@/lib/domain/selectors";

function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function ProfileHeader({
  profile,
  stats,
}: {
  profile: Profile;
  stats: PortfolioStats;
}) {
  return (
    <header className="profile-header">
      <div className="profile-identity">
        {profile.avatarUrl ? (
          <span
            className="profile-avatar"
            role="img"
            aria-label={`${profile.displayName}'s avatar`}
            style={{ backgroundImage: `url(${profile.avatarUrl})` }}
          />
        ) : (
          <span className="profile-avatar profile-initials" aria-hidden="true">
            {initials(profile.displayName)}
          </span>
        )}
        <div>
          <p className="profile-kicker">Private portfolio</p>
          <h1>{profile.displayName}</h1>
        </div>
      </div>
      {profile.bio ? <p className="profile-bio">{profile.bio}</p> : null}
      <dl className="profile-stats">
        <div>
          <strong>{stats.animals}</strong>
          <dt>Animals</dt>
        </div>
        <div>
          <strong>{stats.countries}</strong>
          <dt>Countries</dt>
        </div>
        <div>
          <strong>{stats.distanceKm}</strong>
          <dt>km walked</dt>
        </div>
      </dl>
    </header>
  );
}
