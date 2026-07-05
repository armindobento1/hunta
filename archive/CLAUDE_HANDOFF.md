# Claude Handoff — Hunta

Last updated: 2026-06-30

## Current state

Hunta is a Vite + React + TypeScript + React Router SPA using Firebase Auth,
Firestore, and Storage. Production is deployed at:

- https://onfoothunta.vercel.app
- Firebase project: `onfoothunta`
- Working branch: `codex/firebase-hunting-portfolio-v1`

The worktree contains substantial uncommitted migration and feature work. Do
not reset, discard, or overwrite unrelated changes. No commit or push was made.

## Major changes completed

### Product and UI

- Renamed the customer-facing product to **Hunta**.
- Migrated the active app to Vite/React Router with clean Vercel SPA routes.
- Implemented the supplied mobile-first v2 design and Hunta dog mark.
- Added five-tab navigation, private portfolio feed, location grouping, armory,
  map, and leaderboard surfaces.

### Armory and loadouts

- Armory is independent from hunts.
- Users can save weapons, optics, suppressors, bipods, slings, and ammunition.
- Users can create Call-of-Duty-style weapon-first loadouts.
- Selecting a loadout in a hunt form pre-fills the weapon, ammunition, and
  attachment snapshot.
- Historical hunts retain factual equipment snapshots; later armory edits do
  not rewrite them.

Key files:

- `lib/domain/armory.ts`
- `lib/firebase/armory-repository.ts`
- `components/portfolio/armory-view.tsx`
- `lib/hooks/use-armory.ts`

### Location search

- Hunt location entry searches real Esri World Geocoder results.
- Selecting a result stores place/farm, coordinates, and provider provenance.
- Exact coordinate fields are hidden behind an optional refinement control.
- `VITE_GEOCODING_URL` can override the default endpoint.

Key files:

- `lib/location/search-locations.ts`
- `components/kills/location-fields.tsx`

### Public social layer

- Private kill source documents remain under `users/{uid}/kills/{killId}` and
  are never publicly readable.
- Publishing is explicit per hunt through `isPublic`.
- Publishing creates a separate read-only projection at
  `publicHunts/{uid}_{killId}`.
- Public profiles live at `publicProfiles/{uid}` and support normalized prefix
  account search.
- Users can follow/unfollow accounts.
- Feed now has **My hunts** and **Community** modes; Community has **Following**
  and **Discover** views.
- The leaderboard uses published measured hunts and includes account search.
- Public routes:
  - `/people/:uid`
  - `/people/:uid/hunts/:publicHuntId`
- Farm names and exact GPS coordinates are public when the owner explicitly
  publishes a hunt. The form displays a warning before publication.
- Unpublishing removes only the public projection; private kill data and media
  remain intact.

Key files:

- `lib/domain/public-social.ts`
- `lib/firebase/public-social-repository.ts`
- `lib/firebase/follow-repository.ts`
- `src/providers/social-data-provider.tsx`
- `components/social/`
- `src/pages/public-profile-page.tsx`
- `src/pages/public-hunt-page.tsx`

## Firebase security and indexes

`firestore.rules` now covers:

- UID-isolated private profiles, kills, armory items, and loadouts.
- Public reads for public profile/hunt projections.
- Owner-only public projection writes.
- Follower-controlled follow writes.
- Continued cross-user denial for private kill source records.

`firestore.indexes.json` includes the public-hunt owner/date index. Rules and
indexes are deployed to the `onfoothunta` Firebase project.

## Verification status

The final release gates passed before deployment:

- `npm run typecheck`
- `npm run lint`
- `npm test` — 82 tests passed
- Java 21 `npm run test:rules` — 14 tests passed
- `npm run build`

The production home page and public route behavior were smoke-tested in the
in-app browser without console errors.

For rule tests use:

```bash
JAVA_HOME=/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home \
PATH=/opt/homebrew/opt/openjdk@21/bin:$PATH npm run test:rules
```

## Important behavior and caveats

- Existing hunts remain private until edited and explicitly published.
- An account becomes searchable after its owner opens the authenticated app and
  the public profile projection is synchronized.
- Community queries are intentionally bounded for the current scale. Feed
  fan-out, pagination, follower counters, notifications, blocking, comments,
  and likes are not implemented.
- Vite reports large bundle warnings for MapLibre and the main application
  chunk; this does not currently fail the build.
- Preserve the invariants in `AGENTS.md`: private source isolation, factual
  data integrity, non-destructive media handling, and source-derived GPX facts.

## Design and implementation notes

- `docs/superpowers/specs/2026-06-30-armory-loadouts-location-search-design.md`
- `docs/superpowers/plans/2026-06-30-armory-loadouts-location-search.md`
- `docs/superpowers/specs/2026-06-30-public-social-feed-following-design.md`
- `docs/superpowers/plans/2026-06-30-public-social-feed-following.md`
- `vault/0-Overview/Data-Model.md`
- `vault/0-Overview/System-Architecture.md`
- `vault/Frontend/Portfolio-v1.md`

## Recommended next check

Use two real accounts to exercise the full production flow:

1. Open each account once so both public profiles exist.
2. Search and follow the other account.
3. Publish a measured hunt from one account.
4. Confirm it appears in Discover, the follower feed, public profile, and
   leaderboard.
5. Unpublish it and confirm only the public projection disappears.
