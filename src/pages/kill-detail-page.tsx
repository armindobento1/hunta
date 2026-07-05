import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { HuntDetail } from "@/components/kills/hunt-detail";
import { Spinner } from "@/components/ui/spinner";
import type { Kill } from "@/lib/domain/kill";
import { getKill, moveKillToTrash } from "@/lib/firebase/kill-repository";
import { useAuth } from "@/lib/hooks/use-auth";

export function KillDetailPage() {
  const { killId } = useParams<{ killId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [kill, setKill] = useState<Kill | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !killId) return;
    getKill(user.uid, killId)
      .then((value) => {
        setKill(value);
        setLoading(false);
      })
      .catch(() => {
        setError("This hunt record could not be loaded.");
        setLoading(false);
      });
  }, [killId, user]);

  if (loading) {
    return (
      <main className="centered-state">
        <Spinner label="Loading hunt record" />
      </main>
    );
  }

  if (!kill || error) {
    return (
      <main className="centered-state">
        <p role="alert">{error || "Hunt record not found."}</p>
      </main>
    );
  }

  return (
    <HuntDetail
      kill={kill}
      onTrash={async () => {
        await moveKillToTrash(user!.uid, kill.id);
        navigate("/portfolio");
      }}
    />
  );
}
