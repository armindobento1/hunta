# System Architecture

## Stack
- **Vite + React + TypeScript + React Router** on **Vercel** as a clean-URL SPA.
- **Tailwind CSS** with focused reusable UI components.
- **MapLibre GL JS** for the satellite walk view.
- **GPX parsing** (client-side) for Garmin/Strava route import.
- **Firebase Authentication** for Google and email/password accounts.
- **Cloud Firestore + Cloud Storage** for private per-user records and source
  files, guarded by emulator-tested rules.

## Layers (phased)
1. **Private source layer.** Authoritative portfolios remain nested under the authenticated UID.
2. **Public social projection.** Explicitly published hunt snapshots, searchable public profiles, follow edges, Discover/Following feeds, and public rankings never grant access to private source records.
3. **Later — Capacitor wrap.** The static `dist/` web build becomes the native
   shell input; Capacitor and native folders are not part of the current phase.

## How a kill flows
    Input form (species, weapon, ammo, location→killTime, description, media, GPX)
        → lib/ validates + derives (year from date, distanceKm/durationMin from GPX)
        → Firebase repository (users/{uid}/kills/{killId})
        → views:  Feed (chronological)  |  Group-by-location  |  Country→Year→card
        → Kill detail: media gallery + MapLibre satellite route + all input fields

## Key directories
See `AGENTS.md` → Project structure. `src/` owns routing and application
providers; `lib/` owns all domain logic so UI stays thin and
Capacitor-portable. `firestore.rules` and `storage.rules` enforce the same
ownership boundary independently of the browser.

## Open decisions (track in vault/Decisions when settled)
- Scale strategy for feed fan-out and follower counts beyond the initial bounded queries.
- Production satellite tile service/terms beyond the Esri World Imagery v1
  default.
