# Portfolio v1

## Implemented surface

The customer-facing product name is **Hunta**.

- `/` product welcome.
- `/auth` Google and email/password entry.
- `/portfolio` private profile header, derived statistics, chronological feed,
  list/grid switch, country/place/year grouping, and a standalone private armory
  with weapon-first reusable loadouts.
- `/portfolio/leaderboard` public community rankings from explicitly published measurements, with account search and follow controls.
- `/people/:uid` and `/people/:uid/hunts/:publicHuntId` public read-only profile and hunt routes.
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

The mobile-first iOS-style presentation uses the five-tab v2 navigation and
the supplied Hunta dog mark. Armory equipment and loadouts are independent
owner-scoped records. Hunt creation can select a loadout to prefill factual
equipment snapshots. Location entry is pin-first: a satellite MapLibre picker
(`components/map/location-picker-map.tsx`) sets exact lat/lng by tap, Esri
geocoder search only jumps the map near a town/region, farm name is free text
that search never overwrites, and manual coordinate refinement stays optional.
Pin-set coordinates clear stale geocoder source metadata.

Farms are a community directory (`farms` collection): a farm document is
created only when a hunt there is published publicly (`lib/domain/farm.ts`,
`ensureFarm` in `lib/firebase/farm-repository.ts`), with a deterministic id
(normalized name + ~1 km coordinate bucket) so republishing never duplicates.
Farm entries are immutable from clients (rules deny update/delete); public
hunts may only reference farms that exist. The kill form suggests nearby
community farms after a pin drop; `/farms/:farmId` shows the farm pin and its
published hunts.

The feed offers My Hunts plus a public Community view with Discover and Following modes. Account search uses normalized public profile prefixes. Publishing is opt-in per hunt and warns that farm names and exact GPS coordinates become public.

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
