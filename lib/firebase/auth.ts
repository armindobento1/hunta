import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  OAuthProvider,
  sendPasswordResetEmail,
  signInWithCredential,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  type UserCredential,
} from "firebase/auth";

import { isNativePlatform } from "@/lib/native/platform";

import { getFirebaseServices } from "./config";

const messages: Record<string, string> = {
  "auth/email-already-in-use":
    "An account already exists for this email. Try signing in instead.",
  "auth/invalid-credential":
    "That email and password combination is not correct.",
  "auth/invalid-email": "Enter a valid email address.",
  "auth/missing-credential":
    "Sign-in was cancelled before it finished. Please try again.",
  "auth/popup-closed-by-user": "Google sign-in was closed before it finished.",
  "auth/too-many-requests":
    "Too many attempts. Wait a moment before trying again.",
  "auth/weak-password": "Use a password with at least six characters.",
};

export function authErrorMessage(error: unknown): string {
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof error.code === "string" &&
    messages[error.code]
  ) {
    return messages[error.code];
  }

  return "Something went wrong. Please try again.";
}

export async function signInWithGoogle(): Promise<UserCredential> {
  const { auth } = getFirebaseServices();

  if (isNativePlatform()) {
    const { FirebaseAuthentication } = await import(
      "@capacitor-firebase/authentication"
    );
    const result = await FirebaseAuthentication.signInWithGoogle();
    const idToken = result.credential?.idToken;
    if (!idToken) throw { code: "auth/missing-credential" };
    return signInWithCredential(
      auth,
      GoogleAuthProvider.credential(idToken, result.credential?.accessToken),
    );
  }

  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  return signInWithPopup(auth, provider);
}

export async function signInWithApple(): Promise<UserCredential> {
  const { auth } = getFirebaseServices();
  const provider = new OAuthProvider("apple.com");

  if (isNativePlatform()) {
    const { FirebaseAuthentication } = await import(
      "@capacitor-firebase/authentication"
    );
    const result = await FirebaseAuthentication.signInWithApple();
    const idToken = result.credential?.idToken;
    if (!idToken) throw { code: "auth/missing-credential" };
    return signInWithCredential(
      auth,
      provider.credential({
        idToken,
        rawNonce: result.credential?.nonce,
      }),
    );
  }

  return signInWithPopup(auth, provider);
}

export function signInWithEmail(
  email: string,
  password: string,
): Promise<UserCredential> {
  return signInWithEmailAndPassword(
    getFirebaseServices().auth,
    email.trim(),
    password,
  );
}

export async function createEmailAccount(
  displayName: string,
  email: string,
  password: string,
): Promise<UserCredential> {
  const credential = await createUserWithEmailAndPassword(
    getFirebaseServices().auth,
    email.trim(),
    password,
  );
  await updateProfile(credential.user, { displayName: displayName.trim() });
  return credential;
}

export function resetPassword(email: string): Promise<void> {
  return sendPasswordResetEmail(getFirebaseServices().auth, email.trim());
}

export function signOutCurrentUser(): Promise<void> {
  return signOut(getFirebaseServices().auth);
}
