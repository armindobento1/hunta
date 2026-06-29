"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { HuntDetail } from "@/components/kills/hunt-detail";
import { Spinner } from "@/components/ui/spinner";
import type { Kill } from "@/lib/domain/kill";
import { getKill, moveKillToTrash } from "@/lib/firebase/kill-repository";
import { useAuth } from "@/lib/hooks/use-auth";

export default function KillDetailPage() {
  const { killId } = useParams<{ killId: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const [kill, setKill] = useState<Kill | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    getKill(user.uid, killId)
      .then((value) => {
        setKill(value);
        setLoading(false);
      })
      .catch(() => {
        setError("This fieldnote could not be loaded.");
        setLoading(false);
      });
  }, [killId, user]);

  if (loading) {
    return (
      <main className="centered-state">
        <Spinner label="Loading fieldnote" />
      </main>
    );
  }

  if (!kill || error) {
    return (
      <main className="centered-state">
        <p role="alert">{error || "Fieldnote not found."}</p>
      </main>
    );
  }

  return (
    <HuntDetail
      kill={kill}
      onTrash={async () => {
        await moveKillToTrash(user!.uid, kill.id);
        router.push("/portfolio");
      }}
    />
  );
}
