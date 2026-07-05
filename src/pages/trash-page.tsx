import { TrashView } from "@/components/kills/trash-view";
import { Spinner } from "@/components/ui/spinner";
import { restoreKill } from "@/lib/firebase/kill-repository";
import { useAuth } from "@/lib/hooks/use-auth";
import { useKills } from "@/lib/hooks/use-kills";

export function TrashPage() {
  const { user } = useAuth();
  const { kills, loading, error } = useKills();

  if (loading) {
    return (
      <main className="centered-state">
        <Spinner label="Loading trash" />
      </main>
    );
  }

  if (error) {
    return (
      <main className="centered-state">
        <p role="alert">{error}</p>
      </main>
    );
  }

  return (
    <TrashView
      kills={kills.filter((kill) => kill.status === "trashed")}
      onRestore={(id) => restoreKill(user!.uid, id).then(() => undefined)}
    />
  );
}
