# System Architecture

## Stack
- **Next.js (App Router) + TypeScript** on **Vercel**.
- **Tailwind CSS** with focused reusable UI components.
- **MapLibre GL JS** for the satellite walk view.
- **GPX parsing** (client-side) for Garmin/Strava route import.
- **Firebase Authentication** for Google and email/password accounts.
- **Cloud Firestore + Cloud Storage** for private per-user records and source
  files, guarded by emulator-tested rules.

## Layers (phased)
1. **Now — private multi-user portfolio.** Every Firestore document and Storage
   object is nested under the authenticated UID. Portfolios are private.
2. **Later — social layer.** Add deliberate public projections, friend search,
   and read-only friend access without exposing private source records.
3. **Later — Capacitor wrap.** UI stays a normal web app so the wrap is cheap.

## How a kill flows
    Input form (species, weapon, ammo, location→killTime, description, media, GPX)
        → lib/ validates + derives (year from date, distanceKm/durationMin from GPX)
        → Firebase repository (users/{uid}/kills/{killId})
        → views:  Feed (chronological)  |  Group-by-location  |  Country→Year→card
        → Kill detail: media gallery + MapLibre satellite route + all input fields

## Key directories
See `AGENTS.md` → Project structure. `lib/` owns all domain logic so UI stays
thin and Capacitor-portable. `firestore.rules` and `storage.rules` enforce the
same ownership boundary independently of the browser.

## Open decisions (track in vault/Decisions when settled)
- Public-profile projection and deliberate location-redaction policy.
- Production satellite tile service/terms beyond the Esri World Imagery v1
  default.
