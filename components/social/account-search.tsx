import { Search, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { normalizeSearchName, type PublicProfile } from "@/lib/domain/public-social";
import { searchPublicProfiles } from "@/lib/firebase/public-social-repository";

export function AccountSearch({ currentUserId, followingIds, search = searchPublicProfiles, onToggleFollow }: {
  currentUserId: string; followingIds: string[]; search?: (query: string) => Promise<PublicProfile[]>;
  onToggleFollow(id: string, isFollowing: boolean): void | Promise<void>;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PublicProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    const normalized = normalizeSearchName(query);
    if (normalized.length < 2) return;
    let current = true;
    const timer = window.setTimeout(() => {
      setLoading(true);
      search(normalized).then((items) => { if (current) setResults(items); }).catch(() => { if (current) setError("Hunter search is unavailable."); }).finally(() => { if (current) setLoading(false); });
    }, 200);
    return () => { current = false; window.clearTimeout(timer); };
  }, [query, search]);
  return <section className="account-search" aria-label="Find hunters">
    <div className="account-search-input"><Search aria-hidden="true" /><input type="search" aria-label="Search hunters" placeholder="Search hunters" value={query} onChange={(event) => { setQuery(event.target.value); setError(null); if (event.target.value.trim().length < 2) setResults([]); }} />{loading ? <span>Searching…</span> : null}</div>
    {error ? <p role="alert">{error}</p> : null}
    {query.trim().length >= 2 && !loading ? <div className="account-results">{results.length === 0 ? <p>No public hunters found.</p> : results.map((profile) => {
      const isFollowing = followingIds.includes(profile.id);
      return <article key={profile.id}><Link to={`/people/${profile.id}`}><span className="account-avatar">{profile.avatarUrl ? <img src={profile.avatarUrl} alt="" /> : <UserRound />}</span><span><strong>{profile.displayName}</strong><small>{profile.bio || "Public hunting portfolio"}</small></span></Link>{profile.id !== currentUserId ? <button type="button" aria-label={`${isFollowing ? "Unfollow" : "Follow"} ${profile.displayName}`} onClick={() => onToggleFollow(profile.id, isFollowing)}>{isFollowing ? "Following" : "Follow"}</button> : null}</article>;
    })}</div> : null}
  </section>;
}
