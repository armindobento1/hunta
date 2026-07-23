import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import {
  browserLocalPersistence,
  browserPopupRedirectResolver,
  connectAuthEmulator,
  getAuth,
  indexedDBLocalPersistence,
  initializeAuth,
  inMemoryPersistence,
  type Auth,
} from "firebase/auth";
import {
  connectFirestoreEmulator,
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  type Firestore,
} from "firebase/firestore";
import {
  connectStorageEmulator,
  getStorage,
  type FirebaseStorage,
} from "firebase/storage";
import { z } from "zod";

import { isNativePlatform } from "@/lib/native/platform";

const firebaseConfigSchema = z.object({
  apiKey: z.string().min(1),
  authDomain: z.string().min(1),
  projectId: z.string().min(1),
  storageBucket: z.string().min(1),
  messagingSenderId: z.string().min(1),
  appId: z.string().min(1),
});

export interface FirebaseServices {
  app: FirebaseApp;
  auth: Auth;
  db: Firestore;
  storage: FirebaseStorage;
}

let services: FirebaseServices | null = null;
let emulatorConnected = false;

// Explicit persistence order keeps sessions alive across restarts inside the
// Capacitor WebView, where getAuth()'s defaults are unreliable; in-memory is
// the last resort for environments without web storage (e.g. tests).
// The popup/redirect resolver must NOT be configured on native: it makes auth
// initialization wait on an iframe to the authDomain, which can never respond
// inside the capacitor:// origin, so every sign-in call hangs forever.
function createAuth(app: FirebaseApp): Auth {
  const persistence = [
    indexedDBLocalPersistence,
    browserLocalPersistence,
    inMemoryPersistence,
  ];
  try {
    return isNativePlatform()
      ? initializeAuth(app, { persistence })
      : initializeAuth(app, {
          persistence,
          popupRedirectResolver: browserPopupRedirectResolver,
        });
  } catch {
    // initializeAuth throws if auth was already initialized for this app.
    return getAuth(app);
  }
}

// Firestore's default WebChannel streaming transport fails inside the iOS
// Capacitor WKWebView — the `Listen` RPC stream errors and onSnapshot never
// delivers, so public feeds (which are all live listeners) never load. Force
// long-polling on native; browsers keep the faster WebChannel path. A
// persistent IndexedDB cache serves reads locally and syncs network deltas.
function createFirestore(app: FirebaseApp): Firestore {
  try {
    return initializeFirestore(app, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager(),
      }),
      ...(isNativePlatform() ? { experimentalForceLongPolling: true } : {}),
    });
  } catch {
    // initializeFirestore throws if Firestore was already initialized for this
    // app (e.g. HMR) — reuse the existing instance.
    return getFirestore(app);
  }
}

function environmentConfig() {
  return {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
  };
}

export function isFirebaseConfigured(): boolean {
  return firebaseConfigSchema.safeParse(environmentConfig()).success;
}

export function getFirebaseServices(): FirebaseServices {
  if (services) {
    return services;
  }

  const config = firebaseConfigSchema.parse(environmentConfig());
  const app = getApps().length > 0 ? getApp() : initializeApp(config);
  const auth = createAuth(app);
  const db = createFirestore(app);
  const storage = getStorage(app);

  if (
    import.meta.env.VITE_USE_FIREBASE_EMULATORS === "true" &&
    !emulatorConnected
  ) {
    connectAuthEmulator(auth, "http://127.0.0.1:9099", {
      disableWarnings: true,
    });
    connectFirestoreEmulator(db, "127.0.0.1", 8080);
    connectStorageEmulator(storage, "127.0.0.1", 9199);
    emulatorConnected = true;
  }

  services = { app, auth, db, storage };
  return services;
}
