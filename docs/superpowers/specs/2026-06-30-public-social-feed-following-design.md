# Public Social Feed, Leaderboards, Search, and Following

## Goal

Add Strava-style social discovery to Hunta: users can publish selected hunts, search public accounts, follow or unfollow them, browse a following/discover feed, and compare published trophy scores. Private editable portfolio records remain owner-only.

## Privacy boundary

- `users/{uid}/kills/{killId}` remains the authoritative private source record and is never publicly readable.
- Publishing is explicit per hunt. Existing and new hunts are private unless the owner chooses to publish them.
- A public hunt snapshot may include species, cover photo, media, country, date, kill time, farm/place name, exact coordinates, weapon, ammunition, attachment snapshot, measurements, route summary, and description.
- The UI must warn that farm names and exact GPS coordinates become public before publishing.
- Unpublishing deletes the public projection only. It never deletes or mutates the private hunt or its media.
- Public details are read-only. Only the owner can create, update, or delete their projections.

## Public data model

### Public profiles

`publicProfiles/{uid}` contains the public display name, avatar URL, bio, searchable normalized name, and timestamps. The authenticated owner maintains this projection from their private profile.

### Public hunts

`publicHunts/{uid}_{killId}` contains `ownerId`, `sourceKillId`, the approved public hunt snapshot, owner display summary, and `publishedAt`/`updatedAt`. The document ID is deterministic so publish is idempotent and unpublish is direct.

### Follows

`users/{followerUid}/following/{followedUid}` records an authenticated user's outgoing follow. A matching public edge at `publicFollowers/{followedUid}/followers/{followerUid}` supports follower counts and relationship display. A batched repository operation creates or removes both edges. Security rules ensure a user can mutate only edges where they are the follower.

Counts shown in v1 are derived from edge queries rather than trusted client-maintained counters, avoiding drift.

## Product behavior

### Account search

- Feed and leaderboard pages share a public account search control.
- Search is case-insensitive prefix matching on `searchName` and requires at least two characters.
- Results show avatar, display name, bio, follow state, and a Follow/Following control.
- Selecting an account opens `/people/:uid`, a public profile with published hunts and public personal bests.

### Feed

- “Following” shows published hunts from followed accounts plus the current user's published hunts, reverse-chronological by kill date/time.
- “Discover” shows all recent published hunts, reverse-chronological.
- Empty following state suggests account search and Discover.
- Public cards show hunter identity and navigate to `/people/:uid/hunts/:publicHuntId`.
- The owner's private portfolio feed remains available under “My hunts” and preserves edit navigation.

### Leaderboard

- Rankings use published measurement scores only.
- Species filters remain; each row includes hunter identity, farm, country/date, and factual score/unit.
- Selecting a row opens the public hunt detail.
- Account search is available from the same page and can open a person's published rankings.

### Publishing controls

- New/edit hunt form includes `Publish publicly`.
- Enabling it presents a concise warning that the farm and exact GPS coordinates are visible to everyone.
- Saving a published hunt writes the private source first, then upserts its public projection.
- Turning publishing off deletes the projection after the private save succeeds.
- A projection write failure leaves the private hunt intact and reports that public publishing must be retried.

## Components and boundaries

- `lib/domain/public-social.ts`: public schemas, projection builder, search normalization, public ranking selectors.
- `lib/firebase/public-social-repository.ts`: public profile/hunt subscriptions, account prefix search, public hunt queries, publish/unpublish operations.
- `lib/firebase/follow-repository.ts`: follow/unfollow batch writes and following subscriptions.
- `src/providers/social-data-provider.tsx`: authenticated social state independent of private portfolio subscriptions.
- Focused UI components own account search, follow buttons, social feed controls, public profile, and public hunt detail.
- Existing private kill repositories and views remain unchanged except for the explicit publish lifecycle call.

## Firestore and Storage

- Public profile and public hunt documents allow unauthenticated reads.
- Public projection writes require authentication and matching `ownerId`/UID.
- Following reads require authentication; writes require `request.auth.uid == followerUid`.
- Public media URLs are already Firebase download URLs. Publishing exposes only URLs explicitly copied into a public snapshot; private Firestore records remain closed.
- Composite indexes support recent public hunts, owner hunts, and account prefix search.

## Failure handling

- Search uses a short debounce and clearly distinguishes loading, no results, and network errors.
- Follow buttons use confirmed repository state and disable during writes to prevent duplicate operations.
- Deleted or unpublished hunts disappear from public queries without affecting private data.
- Missing public profiles render a stable “Hunter” fallback without fabricating biographical facts.

## Verification

- Domain tests: projection contains approved facts, excludes private persistence fields, search normalization, species rankings.
- Repository/UI tests: publish/unpublish lifecycle, account search, follow/unfollow, Following versus Discover filtering, public navigation.
- Rule tests: public reads succeed; cross-user projection writes fail; users cannot create follows on behalf of another follower; private kills remain unreadable cross-user.
- Release gates: typecheck, lint, unit tests, Firebase rule tests, production build, browser smoke test, Firebase rules/index deployment, and Vercel production deployment.

## Explicit non-goals

- No comments, likes, direct messages, notifications, activity privacy circles, follow requests, or blocking in this release.
- No direct public access to private kill documents.
- No automatic publication of existing hunts.
