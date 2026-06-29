# Portfolio v1

## Implemented surface

- `/` product welcome.
- `/auth` Google and email/password entry.
- `/portfolio` private profile header, derived statistics, chronological feed,
  list/grid switch, and country/place/year grouping.
- `/portfolio/kills/new` complete draft-first record creation.
- `/portfolio/kills/[killId]` media, facts, narrative, satellite GPX map, edit,
  and confirmed trash action.
- `/portfolio/kills/[killId]/edit` fact-preserving edit flow.
- `/portfolio/trash` recoverable records and restore.
- `/portfolio/profile` name, bio, avatar, trash, and sign-out controls.

## Data flow

Firebase Auth supplies the UID. Hooks subscribe only to `users/{uid}` and
`users/{uid}/kills`. Domain selectors create feed/grouped views without moving
or rewriting records. New records are saved as `draft` before uploads and become
`active` only after validation and attachment linking. Deletes set `trashed` and
never delete Storage objects.

Raw GPX bytes live in Storage. `lib/gpx/parse-gpx.ts` derives points, distance,
duration, and bounds without changing the source. The detail map downloads and
reparses the source before rendering.

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
