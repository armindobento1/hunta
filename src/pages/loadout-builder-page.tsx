import { useParams } from "react-router-dom";

import { LoadoutBuilder } from "@/components/armory/loadout-builder";
import { useArmory } from "@/lib/hooks/use-armory";
import { useAuth } from "@/lib/hooks/use-auth";

export function LoadoutBuilderPage() {
  const { loadoutId } = useParams();
  const { user } = useAuth();
  const { items, loadouts, loading, error } = useArmory();
  if (loading || !user) return <main className="centered-state">{error || "Loading armory…"}</main>;
  const existing = loadoutId ? loadouts.find((entry) => entry.id === loadoutId) : undefined;
  if (loadoutId && !existing) return <main className="centered-state">Loadout not found.</main>;
  return <LoadoutBuilder uid={user.uid} items={items} loadouts={loadouts} existing={existing} />;
}
