import { AccountSearch } from "./account-search";
import { SocialFeed } from "./social-feed";
import { useAuth } from "@/lib/hooks/use-auth";
import { useSocial } from "@/lib/hooks/use-social";

export function SocialDiscovery() { const { user } = useAuth(); const { hunts, followingIds, loading, error, toggleFollow } = useSocial(); if (!user) return null; return <div className="social-discovery"><AccountSearch currentUserId={user.uid} followingIds={followingIds} onToggleFollow={toggleFollow} />{error ? <p role="alert">{error}</p> : null}{loading ? <p className="social-loading">Loading community hunts…</p> : <SocialFeed hunts={hunts} currentUserId={user.uid} followingIds={followingIds} />}</div>; }
