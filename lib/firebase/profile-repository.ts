import {
  doc,
  getDoc,
  onSnapshot,
  setDoc,
  type Unsubscribe,
} from "firebase/firestore";

import { profileSchema, type Profile } from "@/lib/domain/profile";

import { getFirebaseServices } from "./config";
import { deserializeProfile, serializeProfile } from "./serialization";

export async function getProfile(uid: string): Promise<Profile | null> {
  const snapshot = await getDoc(doc(getFirebaseServices().db, "users", uid));
  return snapshot.exists()
    ? deserializeProfile(snapshot.data() as Record<string, unknown>)
    : null;
}

export async function saveProfile(profile: Profile): Promise<void> {
  const parsed = profileSchema.parse(profile);
  await setDoc(
    doc(getFirebaseServices().db, "users", parsed.id),
    serializeProfile(parsed),
  );
}

export function subscribeToProfile(
  uid: string,
  onValue: (profile: Profile | null) => void,
  onError: (error: Error) => void,
): Unsubscribe {
  return onSnapshot(
    doc(getFirebaseServices().db, "users", uid),
    (snapshot) =>
      onValue(
        snapshot.exists()
          ? deserializeProfile(snapshot.data() as Record<string, unknown>)
          : null,
      ),
    onError,
  );
}
