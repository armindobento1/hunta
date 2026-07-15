# Portfolio v1

## Implemented surface

The customer-facing product name is **Hunta**.

- `/` product welcome (signed-in visitors redirect to `/home`).
- `/auth` Google and email/password entry (redirects to `/home` on success).
- `/home` Instagram-style home feed: published hunts from followed hunters
  (plus your own), reverse-chronological, leaderboard link in the top bar.
- `/discover` account search plus a 3-column explore grid of all public hunts.
- `/portfolio` private profile header, derived statistics, chronological feed,
  list/grid switch, country/place/year grouping, and a standalone private armory
  with weapon-first reusable loadouts.
- `/portfolio/leaderboard` public community rankings from explicitly published measurements, with account search and follow controls.
- `/people/:uid`, live follower/following lists, public hunt detail, comments,
  and `/people/:uid/hunts/:publicHuntId/likes` likers routes.
- `/portfolio/map` satellite map of the owner's saved kill locations.
- `/portfolio/kills/new` complete draft-first record creation.
- `/portfolio/kills/:killId` media, facts, narrative, satellite GPX map, edit,
  and confirmed trash action.
- `/portfolio/kills/:killId/edit` fact-preserving edit flow.
- `/portfolio/trash` recoverable records and restore.
- `/portfolio/profile` name, bio, avatar, trash, and sign-out controls.

## Data flow

Firebase Auth supplies the UID. One provider keeps subscriptions to
`users/{uid}`, `users/{uid}/kills`, `users/{uid}/armoryItems`, and
`users/{uid}/loadouts` mounted across private route navigation.
Hooks read those in-memory snapshots. Domain selectors create feed/grouped views without moving
or rewriting records. New records are saved as `draft` before uploads and become
`active` only after validation and attachment linking. Deletes set `trashed` and
never delete Storage objects.

Raw GPX bytes live in Storage. `lib/gpx/parse-gpx.ts` derives points, distance,
duration, and bounds without changing the source. The detail map downloads and
reparses the source before rendering.

The mobile-first iOS-style presentation uses the five-tab v2 navigation
(Home, Discover, log-kill FAB, Map, Profile) and the supplied Hunta dog mark.
`components/providers/navigation-gestures.tsx` adds back navigation: a
left-edge swipe pops history on touch devices, and the Android hardware back
button (via `@capacitor/app`) goes back or minimizes the app at the history
root. Armory equipment and loadouts are independent
owner-scoped records. Hunt creation can select a loadout to prefill factual
equipment snapshots. Location entry is pin-first: a satellite MapLibre picker
(`components/map/location-picker-map.tsx`) sets exact lat/lng by tap, Esri
geocoder search only jumps the map near a town/region, farm name is free text
that search never overwrites, and manual coordinate refinement stays optional.
Pin-set coordinates clear stale geocoder source metadata.

The public farm directory is retired (2026-07-11, audit v1.1 F-01): farm
documents carried exact coordinates and were world-readable. The `farms`
collection is locked in rules (`read, write: if false`); `farm-page`,
`farm-view`, `public-hunts-map`, and `farm-repository` live in
`archive/social-farms/`; farm name is free text on the kill form (no nearby
suggestions). A public hunt's location is **farm name + area text only**
(`publicLocationSchema`) — hunters find the farm themselves.

The feed offers My Hunts plus a public Community view with Discover and
Following modes. Account search uses normalized public profile prefixes.
Follower/following membership and hunt likers use live subscriptions; public
profiles are resolved through a shared cached people lookup, while profile
header counts remain aggregate queries refreshed after follow toggles.
Public deep-link back controls fall back to an in-app route at history root;
hunt and comment URLs canonicalize the owner UID, and share failures surface inline.
Activity waits for its first notification snapshot before showing an empty state;
public hunt lists sort by date, kill time, then publication time on the client.
Rejected public reads render load alerts rather than false not-found states, and
hunt-detail video playback uses a keyboard-accessible overlay with no dead Save control.
Publishing is opt-in per hunt; the entire social surface is gated by
`VITE_SOCIAL_ENABLED` (`lib/features.ts`), off by default and in prod until
the remaining audit v1.1 findings land.

## Invariant guards

1. `lib/domain/kill.ts`, `lib/domain/kill-edit.ts`, and
   `lib/firebase/kill-repository.ts` preserve core facts and ownership.
2. `lib/gpx/` and `components/kills/location-fields.tsx` prohibit fabricated
   route/location values.
3. `lib/firebase/storage-repository.ts`, `storage.rules`, and the trash-only
   flow preserve attachments.
4. `firestore.rules`, `storage.rules`, and `tests/rules/` enforce UID isolation.

## Verification

Release gates: `npm run typecheck`, `npm run lint`, `npm test`,
`npm run test:rules`, and `npm run build`. Node 24 and Java 21 are the supported
local toolchain.

## Web runtime

Hunta is a Vite + React Router SPA. Vercel serves `dist/` with a clean-URL
fallback to `index.html`. Capacitor and native projects remain deferred.
