import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  setDoc,
  type Unsubscribe,
} from "firebase/firestore";

import { applyKillEdit, type KillEdit } from "@/lib/domain/kill-edit";
import { killSchema, type Kill } from "@/lib/domain/kill";

import { getFirebaseServices } from "./config";
import { deserializeKill, serializeKill } from "./serialization";

function killReference(uid: string, killId: string) {
  return doc(getFirebaseServices().db, "users", uid, "kills", killId);
}

export async function saveKill(kill: Kill): Promise<void> {
  const parsed = killSchema.parse(kill);
  await setDoc(killReference(parsed.ownerId, parsed.id), serializeKill(parsed));
}

export async function getKill(
  uid: string,
  killId: string,
): Promise<Kill | null> {
  const snapshot = await getDoc(killReference(uid, killId));
  return snapshot.exists()
    ? deserializeKill(snapshot.data() as Record<string, unknown>)
    : null;
}

export async function updateKill(
  uid: string,
  killId: string,
  edit: KillEdit,
): Promise<Kill> {
  const existing = await getKill(uid, killId);
  if (!existing) {
    throw new Error("Kill record not found.");
  }

  const updated = applyKillEdit(existing, edit);
  await saveKill(updated);
  return updated;
}

export function subscribeToKills(
  uid: string,
  onValue: (kills: Kill[]) => void,
  onError: (error: Error) => void,
): Unsubscribe {
  return onSnapshot(
    collection(getFirebaseServices().db, "users", uid, "kills"),
    (snapshot) => {
      let kills: Kill[];
      try {
        kills = snapshot.docs.map((item) =>
          deserializeKill(item.data() as Record<string, unknown>),
        );
      } catch (cause) {
        onError(
          cause instanceof Error
            ? cause
            : new Error("Kill records could not be read."),
        );
        return;
      }
      onValue(kills);
    },
    onError,
  );
}

export async function moveKillToTrash(
  uid: string,
  killId: string,
): Promise<Kill> {
  const now = new Date().toISOString();
  return updateKill(uid, killId, {
    status: "trashed",
    trashedAt: now,
  });
}

export function restoreKill(uid: string, killId: string): Promise<Kill> {
  return updateKill(uid, killId, { status: "active", trashedAt: null });
}
