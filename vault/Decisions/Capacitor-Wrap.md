# Decision — Capacitor wrap (iOS + Android)

**Date:** 2026-07-06 · **Status:** implemented on `feat/capacitor-wrap`

## What
The web SPA is wrapped with Capacitor 8. `ios/` (SPM, no CocoaPods) and
`android/` are generated native shells — never hand-edit beyond the
config-only files listed below; web code stays the single source of truth.

- `capacitor.config.ts` — appId `com.onfoothunta.app` (com.hunta.app was taken by another Apple team; Android Java namespace stays com.hunta.app, only applicationId changed), webDir `dist`.
- Scripts: `npm run cap:sync` (build + sync both platforms), `cap:ios`,
  `cap:android` (sync + open IDE).

## Config-only native edits (redo if platforms are ever regenerated)
- `ios/App/App/Info.plist` — usage strings: camera, photo library (read+add),
  location-when-in-use.
- `android/app/src/main/AndroidManifest.xml` — `ACCESS_FINE_LOCATION` +
  `ACCESS_COARSE_LOCATION` (Capacitor bridge grants `navigator.geolocation`).

## Web-side changes for native
- `lib/native/platform.ts` — `isNativePlatform()` + `isIOSNativePlatform()` gates.
- Native OAuth via `@capacitor-firebase/authentication` (skipNativeAuth: true —
  plugin only mints the credential; all Firebase access stays in the JS SDK).
  `signInWithGoogle` branches: native → plugin → `signInWithCredential`;
  web → existing popup. `signInWithApple` added the same way; Apple button
  shows on iOS native only (web/Android need an Apple Services ID first).
- Config files generated via Firebase CLI (`apps:create` + `apps:sdkconfig`,
  project `onfoothunta`): `ios/App/App/GoogleService-Info.plist` (in pbxproj
  Resources) and `android/app/google-services.json` (gradle auto-applies
  google-services plugin). Android debug keystore SHA-1 registered.
- iOS pbxproj: DEVELOPMENT_TEAM A6848V2683, `App.entitlements`
  (Sign in with Apple), Google reversed-client-id URL scheme in Info.plist.
- Console-only steps: enable Apple provider (iOS-only flow needs no Services
  ID) and keep Google provider enabled in Firebase Auth.
- `lib/firebase/config.ts` — `initializeAuth` with explicit persistence order
  (indexedDB → local → in-memory) so sessions survive app restarts in the
  WebView; `browserPopupRedirectResolver` kept for web popup flow.
- `index.html` — `viewport-fit=cover` so the existing `env(safe-area-inset-*)`
  CSS actually takes effect on notched iPhones.
- `eslint.config.mjs` ignores `ios/**` and `android/**` (contain built JS copies).

## Build requirements
- iOS: Xcode (verified compiling on Xcode 26.2, SPM).
- Android: Android Studio with SDK + JDK 21 (not installed on this machine —
  project generated but unbuilt locally; gradle wrapper fetches the rest).
- Env vars are baked at build time — run `npm run cap:sync` after changing
  `.env` values; native apps use whatever Firebase project the build embedded.
