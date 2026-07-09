import { deleteUser } from "firebase/auth";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  where,
  writeBatch,
  type DocumentReference,
} from "firebase/firestore";
import { deleteObject, listAll, ref, type StorageReference } from "firebase/storage";

import { getFirebaseServices } from "./config";

const BATCH_LIMIT = 500;

async function deleteReferences(references: DocumentReference[]): Promise<void> {
  const { db } = getFirebaseServices();
  for (let start = 0; start < references.length; start += BATCH_LIMIT) {
    const batch = writeBatch(db);
    for (const reference of references.slice(start, start + BATCH_LIMIT)) {
      batch.delete(reference);
    }
    await batch.commit();
  }
}

async function collectFiles(folder: StorageReference): Promise<StorageReference[]> {
  const { items, prefixes } = await listAll(folder);
  const nested = await Promise.all(prefixes.map(collectFiles));
  return [...items, ...nested.flat()];
}

/**
 * Removes every trace of the user's data, in an order that keeps a partially
 * failed run retryable: public projections first, then private records, the
 * profile document, and finally storage files. Every step is idempotent.
 * Community `farms` entries are immutable by design and are not removed.
 */
export async function deleteAccountData(uid: string): Promise<void> {
  const { db } = getFirebaseServices();

  const followingSnapshot = await getDocs(collection(db, "users", uid, "following"));
  await deleteReferences(
    followingSnapshot.docs.flatMap((edge) => [
      doc(db, "publicFollowers", edge.id, "followers", uid),
      edge.ref,
    ]),
  );

  const followersSnapshot = await getDocs(collection(db, "publicFollowers", uid, "followers"));
  const huntsSnapshot = await getDocs(
    query(collection(db, "publicHunts"), where("ownerId", "==", uid)),
  );
  await deleteReferences([
    ...followersSnapshot.docs.map((entry) => entry.ref),
    ...huntsSnapshot.docs.map((entry) => entry.ref),
  ]);
  await deleteDoc(doc(db, "publicProfiles", uid));

  for (const name of ["kills", "armoryItems", "loadouts"]) {
    const snapshot = await getDocs(collection(db, "users", uid, name));
    await deleteReferences(snapshot.docs.map((entry) => entry.ref));
  }
  await deleteDoc(doc(db, "users", uid));

  const files = await collectFiles(ref(getFirebaseServices().storage, `users/${uid}`));
  await Promise.all(files.map((file) => deleteObject(file)));
}

/**
 * Permanently deletes the signed-in user's account. The caller must
 * re-authenticate first (`reauthenticateForDeletion`) — Firebase rejects
 * account deletion without a recent sign-in.
 */
export async function deleteAccount(): Promise<void> {
  const user = getFirebaseServices().auth.currentUser;
  if (!user) {
    throw new Error("No signed-in user.");
  }
  await deleteAccountData(user.uid);
  await deleteUser(user);
}
