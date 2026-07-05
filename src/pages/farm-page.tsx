import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import { FarmView } from "@/components/social/farm-view";
import type { Farm } from "@/lib/domain/farm";
import type { PublicHunt } from "@/lib/domain/public-social";
import { getFarm } from "@/lib/firebase/farm-repository";
import { getPublicHuntsByFarm } from "@/lib/firebase/public-social-repository";

export function FarmPage() {
  const { farmId = "" } = useParams();
  const [farm, setFarm] = useState<Farm | null>();
  const [hunts, setHunts] = useState<PublicHunt[]>([]);

  useEffect(() => {
    Promise.all([getFarm(farmId), getPublicHuntsByFarm(farmId)])
      .then(([value, items]) => {
        setFarm(value);
        setHunts(items);
      })
      .catch(() => setFarm(null));
  }, [farmId]);

  if (farm === undefined) return <main className="centered-state">Loading farm…</main>;
  if (!farm) return <main className="centered-state">Farm not found.</main>;
  return <FarmView farm={farm} hunts={hunts} />;
}
