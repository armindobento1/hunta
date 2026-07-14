import { ArchiveRestore, ArrowLeft } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import type { Kill } from "@/lib/domain/kill";

export function TrashView({
  kills,
  onRestore,
}: {
  kills: Kill[];
  onRestore(id: string): Promise<void>;
}) {
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function restore(id: string) {
    setPendingId(id);
    setError(null);
    try {
      await onRestore(id);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "The hunt record could not be restored.",
      );
    } finally {
      setPendingId(null);
    }
  }

  return (
    <main className="trash-page">
      <Link to="/portfolio">
        <ArrowLeft aria-hidden="true" /> Portfolio
      </Link>
      <p className="eyebrow">Recoverable records</p>
      <h1>Trash</h1>
      <p>Nothing here is permanently deleted. Restore a hunt record at any time.</p>
      {error ? <p role="alert">{error}</p> : null}
      {kills.length === 0 ? (
        <div className="empty-trash">Trash is empty.</div>
      ) : (
        <div className="trash-list">
          {kills.map((kill) => (
            <article key={kill.id}>
              <div>
                <strong>{kill.species}</strong>
                <span>
                  {kill.location.placeName} · {kill.date}
                </span>
              </div>
              <Button
                variant="secondary"
                disabled={pendingId === kill.id}
                aria-label={`Restore ${kill.species}`}
                onClick={() => restore(kill.id)}
              >
                <ArchiveRestore aria-hidden="true" size={16} /> Restore
              </Button>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
