import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { PublicHuntDetail } from "@/components/social/public-hunt-detail";
import type { PublicHunt } from "@/lib/domain/public-social";
import { getPublicHunt } from "@/lib/firebase/public-social-repository";

export function PublicHuntPage() { const { publicHuntId = "" } = useParams(); const [hunt, setHunt] = useState<PublicHunt | null>(); useEffect(() => { getPublicHunt(publicHuntId).then(setHunt).catch(() => setHunt(null)); }, [publicHuntId]); if (hunt === undefined) return <main className="centered-state">Loading public hunt…</main>; if (!hunt) return <main className="centered-state">Public hunt not found.</main>; return <PublicHuntDetail hunt={hunt} />; }
