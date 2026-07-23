# Decision — Local-first performance (2026-07-23)

Batch of three changes to make the app open fast, scroll smoothly, and lean on
the network only for what actually changed. Motivated by: every screen was a
live Firestore listener with no local cache (re-fetch + spinner on every open),
full-resolution photos served everywhere, and no vendor code-splitting.

## 1. Firestore persistent local cache — `lib/firebase/config.ts`
`createFirestore` now calls `initializeFirestore` on **both** web and native
with `localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })`.
Native keeps `experimentalForceLongPolling: true` (WKWebView WebChannel bug —
see [[Capacitor-Wrap]]). Effect: reads (kills, profile, armory, feed) are served
from IndexedDB instantly on reopen/navigation, and only deltas sync over the
wire; the app keeps working on bad/no signal. Falls back to `getFirestore(app)`
if already initialized (HMR). **Does not touch security rules** — `test:rules`
unaffected. This is the primary "keep data local" lever.

## 2. Downscale photos on upload — `lib/firebase/optimize-image.ts`
New pure-browser util wired into `uploadMedia` (photos only) and `uploadAvatar`.
Re-encodes to WebP, downscale-only (max 2560px; avatars 768px), EXIF orientation
preserved, never upscales, never emits a file larger than the original. The
stored WebP is the single media file — **the camera original is not retained**
(user-approved; the alternatives were keep-original+server-thumbnails and
client-compress+keep-original, both rejected for complexity/schema cost).
Fails safe: non-browser env, `image/gif`, `image/svg+xml`, or any decode/encode
failure returns the original file unchanged. See Invariant 3 note in
[[Hunta-Playbook]] §3.

## 3. Vendor bundle chunking — `vite.config.ts`
`build.rollupOptions.output.manualChunks` splits `maplibre`, `firebase`,
`router`, `react`. Key win: **MapLibre (~273 kB gzip) is now lazy** — it only
loads on map routes, off the initial path. Firebase/React/router split for
long-term CDN caching.

## Deferred (not done in this batch)
- **PWA / service worker** — needs generated icon assets (no `public/` dir or
  icons exist today) and must be guarded off in the Capacitor native WebView.
  Web repeat-loads are already covered by immutable `/assets` CDN caching +
  the new Firestore cache, so this is polish, not core.
- Route-transition skeletons (vs full-page Suspense spinner), lazy-route chunk
  prefetch on intent, and public-feed pagination (`subscribeToPublicHunts`
  loads all hunts — a future scaling limit).

## Gates
typecheck / lint / test (170) / build all green. `test:rules` not run (no rules
change). Implemented by Codex, reviewed + gates re-run by Claude.
