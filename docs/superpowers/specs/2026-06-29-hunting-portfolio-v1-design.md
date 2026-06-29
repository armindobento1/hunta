# Hunting Portfolio v1 Design

**Date:** 2026-06-29  
**Status:** Approved for implementation  
**Product:** Private multi-user hunting portfolio

## Goal

Build a production-ready first release of the hunting portfolio described by
the repository documentation and supplied iOS design canvas. A visitor can
create an account with Google or email/password, maintain a private portfolio
of complete kill records, and access it from a responsive web app deployed on
Vercel. Firebase provides authentication, document storage, and file storage.

## Success criteria

- A new user can register, sign in, complete a profile, sign out, and return.
- Authenticated users can create, view, edit, group, trash, and restore their
  own kill records.
- Each kill retains its factual fields, linked media, and original GPX file.
- Photos, videos, and GPX files upload with visible progress and retryable
  errors.
- Feed ordering is reverse chronological by kill date and exact kill time.
- The location view groups the same records without rewriting them.
- A GPX route renders over satellite imagery with metrics derived from the raw
  track.
- Firestore and Storage rules deny cross-user access.
- The responsive UI preserves the supplied Apple-style visual language.
- The repository is published to GitHub and the app is deployed to Vercel.

## Scope

### Included

- Google and email/password authentication.
- Private per-user profiles and portfolios.
- Full kill create, read, update, trash, and restore flows.
- Cover-photo selection and multi-file photo/video upload.
- Exact date, kill time, coordinates, and place-name entry.
- Rifle and bow weapon variants plus ammunition details.
- Original GPX upload, client-side parsing, derived distance/duration/bounds,
  and MapLibre satellite rendering.
- Feed list/grid views and country/place/year grouping.
- Profile statistics derived from the current user's active records.
- Light and dark modes, mobile-first layout, and responsive desktop layout.
- Firebase emulator-backed security-rule tests and application tests.

### Excluded from v1

- Public profiles, friend search, following, comments, and activity feeds.
- Social access to another user's records.
- Admin dashboards, moderation, payments, or subscriptions.
- Permanent file deletion. Trashed records and attachments remain recoverable.
- Native iOS/Android builds. The web app remains Capacitor-compatible.

## Architecture

The application is a Next.js App Router and TypeScript web app deployed to
Vercel. Authenticated client components use the modular Firebase Web SDK for
Authentication, Cloud Firestore, and Cloud Storage. Firestore and Storage
security rules, rather than a trusted browser, enforce ownership.

Domain code remains framework-independent under `lib/`: kill validation,
fact-preserving edit construction, feed/grouping selectors, GPX parsing, and
derived metrics. Firebase adapters live separately so a future backend can
replace persistence without changing domain behavior. Browser-only Firebase,
geolocation, DOM parsing, and MapLibre code never execute during server render.

The app uses MapLibre GL JS with a configured satellite raster source. GPX is
parsed in the browser from its original text. Derived route information is a
cache; the raw GPX object is authoritative.

## Firebase hierarchy

```text
users/{uid}
  displayName
  avatarUrl
  bio
  createdAt
  updatedAt

users/{uid}/kills/{killId}
  ownerId
  species
  coverMediaId
  media[]
  country
  date
  killTime
  location
  weapon
  ammunition
  route
  description
  status
  createdAt
  updatedAt
  trashedAt
```

Storage objects use ownership-addressable paths:

```text
users/{uid}/avatars/{fileId}-{safeName}
users/{uid}/kills/{killId}/media/{mediaId}-{safeName}
users/{uid}/kills/{killId}/routes/{routeId}.gpx
```

`ownerId` is stored for future query and migration needs, but path ownership
and `request.auth.uid` are the authorization source of truth.

## Domain model

### Profile

- `id`: Firebase Auth UID.
- `displayName`: required display label.
- `avatarUrl`: optional Firebase Storage URL/reference.
- `bio`: optional plain text.
- `createdAt`, `updatedAt`: server timestamps.

### Kill

- `id`: stable UUID generated before uploads begin.
- `ownerId`: Firebase Auth UID.
- `species`: required factual name.
- `coverMediaId`: reference to one item in `media`; required when active and
  optional while a recoverable draft is uploading.
- `media`: ordered photo/video metadata objects with stable IDs, storage paths,
  content types, sizes, and upload names.
- `country`: required grouping value.
- `date`: required ISO calendar date. Year is always derived.
- `killTime`: required local ISO time entered or confirmed by the user.
- `location`: required latitude, longitude, and place name.
- `weapon`: discriminated union of rifle (`model`, `caliber`) or bow (`model`,
  `bowType`).
- `ammunition`: required positive grain weight plus optional brand/detail.
- `route`: optional GPX metadata containing storage path, original file name,
  distance, duration, bounds, and source hash. Raw XML is stored verbatim in
  Storage.
- `description`: optional hunt narrative.
- `status`: `draft`, `active`, or `trashed`. Portfolio views include only
  active records.
- `createdAt`, `updatedAt`, `trashedAt`: audit timestamps.

## Integrity behavior

Create allocates the kill ID and draft state before uploads. Media and GPX
objects are uploaded under that ID, then the validated Firestore record is
finalized. Failed uploads leave a recoverable draft rather than associating a
file with another record.

Edit begins with the complete existing record and applies only validated user
changes. Omitting a field from an edit never clears it. Existing media and route
references remain unless the user explicitly replaces or removes them. A newly
uploaded attachment is referenced only after upload succeeds.

Delete is implemented as a confirmed move to trash. It changes status and
timestamps only; Firestore facts and Storage objects remain intact. Users can
restore trashed records. Permanent deletion is outside v1.

## GPX behavior

The selected `.gpx` file is read as text without normalization and uploaded as
the original source. The parser validates XML and extracts ordered track points
and timestamps. Distance is the sum of Haversine distances between adjacent
valid points. Duration is the difference between the earliest and latest valid
timestamps. Bounds are derived from valid coordinates. No missing coordinate or
time is invented.

If parsing fails, the file is not attached and the user sees a specific error.
If timestamps are absent, the route can retain distance and bounds but duration
is unavailable. The detail view downloads and reparses the raw GPX for the map,
so cached metrics never replace the source.

## Security

Firestore rules allow a signed-in user to read and write only
`users/{request.auth.uid}` and that user's nested kill documents. Creates must
match `ownerId` to the authenticated UID. Updates cannot change ownership.
Unauthenticated and cross-user requests are denied.

Storage rules apply the same UID boundary to avatar, media, and route paths.
Rules validate expected content types and practical size ceilings. Photos,
videos, and GPX have separate allow lists. Firebase configuration values exposed
to the browser are not treated as secrets; authorization depends on rules.

Security tests run against the Firebase Emulator Suite and prove owner access,
unauthenticated denial, cross-user denial, and ownership immutability. The
Firebase Security Rules Auditor is run before release.

## User experience

### Authentication

A branded welcome screen offers Google sign-in and email sign-up/sign-in.
Errors use human-readable messages and retain safe form input. Successful first
sign-in opens lightweight profile setup.

### Portfolio

The supplied profile header, statistics, Feed/By Location segmented control,
list/grid toggle, overlay cards, and bottom navigation define the mobile UI.
Desktop uses the same components in a centered wide layout with more visible
content rather than imitating a phone frame.

Feed shows active records ordered by combined date/time descending. By Location
groups active records by country, then place and derived year. Empty accounts
receive a guided first-record state rather than fabricated sample kills.

### Record editor

A sectioned form covers media, species/date/time, location, weapon/ammunition,
GPX, and narrative. It supports current-location capture and manual coordinates;
both require user confirmation. Save is blocked until required facts validate.
Uploads display progress and individual retry actions.

### Hunt detail

The cover image leads into media, factual chips, narrative, and a satellite map
with the GPX track and derived metrics. Edit and move-to-trash actions are
available only to the owner.

## Error handling

- Auth failures map Firebase codes to actionable messages.
- Network and Firestore failures preserve the editor state and permit retry.
- Upload failures identify the file and do not silently drop successful files.
- Invalid media type/size and malformed GPX are rejected before persistence.
- Map or tile failures leave record facts readable and show a map-specific
  fallback.
- Empty, loading, offline, error, and permission-denied states are distinct.
- Destructive actions require explicit confirmation.

## Testing and verification

- Vitest unit tests: domain validation, fact-preserving edits, chronological
  sorting, location grouping, GPX distance/duration/bounds, and error cases.
- React Testing Library tests: authentication forms, record form variants,
  validation, upload state, trash/restore confirmation, and empty states.
- Firebase Emulator tests: Firestore and Storage ownership boundaries and
  content validation.
- Browser QA: responsive authentication, portfolio, editor, detail, navigation,
  dark mode, and failure states.
- Required gates: `npm run typecheck`, `npm run lint`, `npm test`, and
  `npm run build`.

## Deployment and operations

The source is committed to a GitHub repository. Vercel imports the repository
and receives public Firebase Web configuration as environment variables.
Production Firebase enables Google and email/password providers, Firestore, and
Cloud Storage. Authorized domains include localhost and the Vercel domain.

Cloud Storage for Firebase requires the Blaze pay-as-you-go plan. No service
account key or Firebase Admin credential is placed in the browser or repository.
`.env.local`, Vercel state, emulator data, and brainstorming artifacts remain
untracked.

## Invariant ownership

1. Kill-record integrity: `lib/domain/kill.ts`, `lib/domain/kill-edit.ts`, and
   the Firebase kill repository.
2. Factual data authority: `lib/gpx/` plus location/time validation in the
   record form.
3. Media preservation: the Firebase upload adapter and trash-only deletion flow.
4. Multi-user isolation: Firebase document/storage paths, Firestore rules,
   Storage rules, and emulator rule tests.
