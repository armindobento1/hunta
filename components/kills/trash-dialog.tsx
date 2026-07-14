"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

export function TrashDialog({
  species,
  onCancel,
  onConfirm,
}: {
  species: string;
  onCancel(): void;
  onConfirm(): Promise<void> | void;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirm() {
    setPending(true);
    setError(null);
    try {
      await onConfirm();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "The hunt record could not be moved to trash.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="dialog-backdrop">
      <section className="trash-dialog" role="dialog" aria-modal="true" aria-labelledby="trash-title">
        <p className="eyebrow">Recoverable action</p>
        <h2 id="trash-title">Move {species} to trash?</h2>
        <p>
          The record, photos, videos, and original GPX stay intact. You can restore
          it at any time.
        </p>
        {error ? <p role="alert">{error}</p> : null}
        <div>
          <Button variant="secondary" disabled={pending} onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="danger" disabled={pending} onClick={confirm}>
            Confirm move to trash
          </Button>
        </div>
      </section>
    </div>
  );
}
