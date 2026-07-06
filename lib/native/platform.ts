import { Capacitor } from "@capacitor/core";

// signInWithPopup cannot work inside the Capacitor WebView (no popup window,
// and capacitor://localhost is not an authorized origin), so native platforms
// route OAuth through @capacitor-firebase/authentication instead.
export function isNativePlatform(): boolean {
  return Capacitor.isNativePlatform();
}

// Sign in with Apple is offered on iOS (native flow needs only the app
// entitlement); the web/Android flow additionally requires an Apple Services
// ID configured in the Firebase console, so it stays hidden there for now.
export function isIOSNativePlatform(): boolean {
  return Capacitor.getPlatform() === "ios";
}
