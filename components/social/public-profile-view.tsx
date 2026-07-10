import { UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import type { PublicHunt, PublicProfile } from "@/lib/domain/public-social";
import { followAccount, subscribeToFollowing, unfollowAccount } from "@/lib/firebase/follow-repository";
import { useAuth } from "@/lib/hooks/use-auth";
import { useFollowStats } from "@/lib/hooks/use-follow-stats";

function FollowButton({ profileId }: { profileId: string }) {
  const { user } = useAuth();
  const [followingIds, setFollowingIds] = useState<string[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (!user || user.uid === profileId) return;
    return subscribeToFollowing(user.uid, setFollowingIds, () => setFollowingIds(null));
  }, [user, profileId]);
  if (!user || user.uid === profileId || !followingIds) return null;
  const isFollowing = followingIds.includes(profileId);
  return (
    <>
      <button
        type="button"
        className={`ig-follow-btn${isFollowing ? " ig-following" : ""}`}
        onClick={async () => {
          try {
            if (isFollowing) await unfollowAccount(user.uid, profileId);
            else await followAccount(user.uid, profileId);
            setError(null);
          } catch (cause) {
            setError(cause instanceof Error ? cause.message : "Could not update follow.");
          }
        }}
      >
        {isFollowing ? "Following" : "Follow"}
      </button>
      {error ? <p role="alert">{error}</p> : null}
    </>
  );
}

export function PublicProfileView({ profile, hunts }: { profile: PublicProfile; hunts: PublicHunt[] }) {
  const { counts, people, error, toggleList } = useFollowStats(profile.id);
  return (
    <main className="public-page ig-profile">
      <header className="ig-head">
        <span className="public-avatar">
          {profile.avatarUrl ? <img src={profile.avatarUrl} alt="" /> : <UserRound />}
        </span>
        <div className="ig-stats">
          <div>
            <strong>{hunts.length}</strong>
            <span>Hunts</span>
          </div>
          <button type="button" onClick={() => void toggleList("followers")}>
            <strong>{counts?.followers ?? "–"}</strong>
            <span>Followers</span>
          </button>
          <button type="button" onClick={() => void toggleList("following")}>
            <strong>{counts?.following ?? "–"}</strong>
            <span>Following</span>
          </button>
        </div>
      </header>
      <div className="ig-identity">
        <h1>{profile.displayName}</h1>
        {profile.bio ? <p>{profile.bio}</p> : null}
      </div>
      <FollowButton profileId={profile.id} />
      {error ? <p role="alert">{error}</p> : null}
      {people ? (
        <ul className="follow-people" aria-label={people.kind}>
          {people.list.length === 0 ? (
            <li>No {people.kind} yet.</li>
          ) : (
            people.list.map((person) => (
              <li key={person.id}>
                <Link to={`/people/${person.id}`}>{person.displayName}</Link>
              </li>
            ))
          )}
        </ul>
      ) : null}
      <section className="ig-grid" aria-label="Published hunts">
        {hunts.length === 0 ? (
          <p className="ig-empty">No published hunts yet.</p>
        ) : (
          hunts.map((hunt) => {
            const cover =
              hunt.media.find((item) => item.id === hunt.coverMediaId && item.kind === "photo") ??
              hunt.media.find((item) => item.kind === "photo");
            return (
              <Link
                key={hunt.id}
                className="ig-tile"
                to={`/people/${hunt.ownerId}/hunts/${hunt.id}`}
                style={cover ? { backgroundImage: `url(${cover.downloadUrl})` } : undefined}
              >
                <span className="ig-tile-label">{hunt.species}</span>
              </Link>
            );
          })
        )}
      </section>
    </main>
  );
}
