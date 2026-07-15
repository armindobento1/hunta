import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { PublicProfileView } from "@/components/social/public-profile-view";
import type { PublicHunt, PublicProfile } from "@/lib/domain/public-social";
import { getPublicHuntsByOwner, getPublicProfile } from "@/lib/firebase/public-social-repository";

export function PublicProfilePage() { const { uid = "" } = useParams(); const [profile, setProfile] = useState<PublicProfile | null>(); const [hunts, setHunts] = useState<PublicHunt[]>([]); const [failure, setFailure] = useState(false); useEffect(() => { Promise.all([getPublicProfile(uid), getPublicHuntsByOwner(uid)]).then(([value, items]) => { setProfile(value); setHunts(items); setFailure(false); }).catch(() => setFailure(true)); }, [uid]); if (failure) return <main className="centered-state" role="alert">Could not load this public profile. Check your connection and try again.</main>; if (profile === undefined) return <main className="centered-state">Loading public profile…</main>; if (!profile) return <main className="centered-state">Public profile not found.</main>; return <PublicProfileView profile={profile} hunts={hunts} />; }
