# Audit: Full Hunta codebase — v1.1

- **Author:** codex
- **Role:** auditor
- **Date:** 2026-07-11
- **Status:** open

## Handover to Claude Code

This is a read-only audit of the current `main` branch at commit `81b8a83`.
No application code, rules, tests, configuration, or vault files were changed.
The only repository change made by the auditor is this handover document.

The user explicitly requested the filename/version `v1.1` in the Codex audit
folder. That overrides the normal odd/even decimal convention in
`audit/README.md` for this pass. Claude Code is the implementer. Claude must
document what it addresses and what it skips, but must not mark this audit
signed off; only Codex may do that after re-review.

## Scope

The audit covered:

- The complete Vite/React route tree and every internal navigation target.
- Authentication, profile creation, private portfolio providers, public social
  providers, follows, notifications, likes, comments, and public routes.
- Kill creation/editing, media and GPX upload, trash/restore, public projection,
  armory/loadouts, selectors, and account deletion.
- Firestore and Storage rules and their emulator tests.
- Build output, cold-load performance, network dependency chains, accessibility,
  SEO basics, static landing-page links, and production URL availability.
- Documentation claims that materially affect setup, privacy, launch, and App
  Store submission.

Generated/native directories and archived code were not treated as active app
source. Native configuration was inspected only where it affects the web/native
boundary. There was no authenticated production test account, so private-screen
performance was established from code and subscription topology, while the
public `/` route was measured against the deployed Vercel app.

## Severity

- **P0 / critical:** active privacy, security, destructive-data, or launch blocker.
- **P1 / high:** core flow is wrong, materially incomplete, or a proven major
  performance/scaling problem.
- **P2 / medium:** meaningful correctness, integrity, accessibility, or UX defect.
- **P3 / low:** documentation, polish, or non-blocking operational defect.

## Executive summary

The code compiles and the existing automated suite is green, but the app is not
safe to ship with the current public/social and account-deletion surfaces. Four
issues deserve an immediate release stop:

1. Exact kill and farm coordinates are intentionally copied into world-readable
   documents, and the social surface is active rather than feature-flagged.
2. Any authenticated user can take over another user's public hunt document by
   replacing its owner fields.
3. Account deletion deletes Firestore first and then attempts Storage deletes
   that the deployed rule model explicitly denies, producing a partially erased
   account that may be recreated by the live profile subscription.
4. Moving a public kill to trash does not unpublish it, so a supposedly removed
   record stays world-readable.

The intermittent slowness also has measured, non-server root causes. The public
home route scored **64** in Lighthouse performance with **4.9 s FCP** and
**6.0 s LCP** under Lighthouse throttling even though server response time was
only **10 ms**. The app ships a 338.9 KiB-gzip main bundle, initializes Firebase
Auth (including its iframe/gapi chain) on the public landing route, blocks render
on Google Fonts and the global stylesheet, and downloads a 208 KiB logo. Once a
user signs in, every private route also opens portfolio, armory, public-hunt, and
following listeners; every visible social feed card opens another likes listener
and another comments listener.

## Findings

### F-01 — Exact hunting coordinates are world-readable — P0 critical

**Evidence**

- `lib/domain/public-social.ts:3,14-20,34-46` reuses the private
  `killLocationSchema` and copies `kill.location` verbatim into `PublicHunt`.
- `lib/domain/farm.ts:12-24,47-61` persists full-precision farm latitude and
  longitude; `farmIdFor` also embeds rounded coordinates in the document ID.
- `firestore.rules:214-225,388-391,429-436` validates full private-style
  locations and grants unauthenticated reads to both `publicHunts` and `farms`.
- `components/kills/kill-form.tsx:433-434` confirms that the feature is active
  and warns users that exact GPS coordinates will be public.
- `components/kills/kill-editor.tsx:84-93` creates the public farm before the
  private draft/save and before the public hunt write. A later upload or save
  failure can therefore expose a precise farm pin even though the hunt was never
  successfully published.
- `LAUNCH-CHECKLIST.md:17-22` already records this as a poaching-relevant
  critical issue, but it remains unresolved.

**Impact**

Farm locations and exact kill sites are sensitive real-world data. The current
projection violates the repository's own invariant that exact lat/lng must never
enter a public/social shape. A public farm can outlive the hunt that caused it to
be created and cannot be corrected or deleted by any client.

**Required implementation**

1. Immediately feature-flag or remove all public/social routes and the publish
   toggle from the release build until a product decision and safe projection
   are implemented.
2. Define a separate `publicLocationSchema`; do not reuse `killLocationSchema`.
   Exclude exact coordinates and geocoder provenance. If a map is required,
   store an explicitly approved coarse region/centroid with documented
   precision, never the source kill point.
3. Apply the same decision to farms. Do not derive a public farm ID from private
   kill coordinates, and do not create a farm before the publish operation is
   guaranteed to proceed.
4. Add Firestore rules that reject precise/private location fields even if a
   modified client sends them.
5. Plan a migration/removal of already published precise documents. Fixing new
   writes does not remove existing exposure.

**Acceptance tests**

- Domain test proves `buildPublicHunt` output contains no exact lat/lng, source
  feature ID, or other private location detail.
- Rules tests deny a public hunt and farm containing exact private coordinates.
- Failed media upload/save cannot create a public farm or projection.
- A scan/migration test confirms existing public documents are sanitized.

### F-02 — Any signed-in user can take over another public hunt — P0 critical

**Evidence**

- `firestore.rules:214-225` checks only that the *new* `data.ownerId` equals
  `request.auth.uid`.
- `firestore.rules:388-391` uses the same predicate for both create and update.
  It never requires `resource.data.ownerId == request.auth.uid` on update.
- An attacker can write a fully valid replacement at an existing
  `/publicHunts/{victimDocumentId}`, change `ownerId` and `hunter.id` to the
  attacker's UID, and then own/delete the document.
- `tests/rules/firestore.rules.test.ts:231-240,273-312` tests public creation but
  contains no cross-owner update/takeover denial.
- `LAUNCH-CHECKLIST.md:23-26` already identifies the issue; it remains active.

**Required implementation**

- Split create and update rules. Update/delete must require the existing owner
  and new owner to equal the authenticated UID, and must preserve immutable ID,
  owner, source-kill, and original publication fields.
- Constrain `publicHuntId` to the canonical owner/source ID scheme, or replace the
  scheme with a non-guessable immutable ID and enforce its ownership binding.

**Acceptance tests**

- Owner can update allowed projection fields.
- Another authenticated user cannot replace, update, or delete the document.
- Owner/source/ID/publishedAt mutation is denied.

### F-03 — Account deletion is destructive, non-atomic, and fails for accounts with files — P0 critical

**Evidence**

- `lib/firebase/account-deletion.ts:41-70` deletes public/private Firestore data
  first, then calls `deleteObject` for every Storage file.
- `storage.rules:35-51` sets `allow delete: if false` for avatars, media, and GPX.
  Therefore an account with any uploaded file cannot complete deletion from this
  client.
- `lib/firebase/account-deletion.ts:77-84` deletes the Auth user only after
  `deleteAccountData` succeeds, leaving the authenticated account alive after a
  Storage failure.
- `src/providers/portfolio-data-provider.tsx:75-105` watches the profile and
  automatically recreates it whenever it disappears. During a failed deletion,
  the still-mounted session can recreate the private profile and then
  automatically recreate the public profile at line 83.
- `src/pages/profile-page.tsx:138-149` reports a generic authentication-style
  error and leaves the user in an undefined partial state.
- Storage rules tests do not exercise a permitted account-deletion path.

**Impact**

The UI promises permanent deletion but can erase Firestore records, fail to
erase files, retain the Auth account, and recreate profile documents. Retrying
does not restore deleted records. This is a data-loss and privacy-compliance
failure, not a cosmetic error.

**Required implementation**

Move full account erasure to a trusted, idempotent backend operation (Cloud
Function/Admin SDK or equivalent) that can enumerate/delete all Firestore
documents and subcollections, revoke Storage objects/tokens, and delete Auth in
a controlled order. Persist deletion state and make retries resume safely. Stop
all live client providers before beginning deletion and show a terminal progress
state. Do not relax normal Storage delete rules merely to make the client sweep
work unless a narrowly constrained, testable deletion design is approved.

**Acceptance tests**

- Account with avatar, photo, video, and GPX deletes completely.
- Failure at each phase is retryable and never recreates profile/public data.
- Auth user is removed only when the deletion job has a durable completion path.
- No Storage object or download token remains usable after completion.

### F-04 — Trashing a public kill leaves it published — P0 critical

**Evidence**

- `src/pages/kill-detail-page.tsx:47-53` calls only `moveKillToTrash`.
- `lib/firebase/kill-repository.ts:67-79` changes the private status and
  `trashedAt`; it never calls `unpublishHunt`.
- The public projection, media download URLs, exact location, likes, and comments
  remain readable. Restore also operates only on the private document.
- There is no integration test for public kill -> trash -> restore.

**Required implementation**

Treat visibility and trash status as one server-authoritative state transition.
A trashed or non-public source record must not have a public projection. The
operation must be idempotent and retryable. Add a repair/reconciliation job for
existing stale projections.

**Acceptance tests**

- Public hunt disappears before/with a successful trash transition.
- A failure cannot report the hunt as safely trashed while it remains public.
- Restore does not republish unless the user explicitly chooses to republish.

### F-05 — Public UGC ships without report, block, or moderation controls — P0 launch blocker

**Evidence**

- Public profiles, hunts, comments, likes, follows, and discover feeds are active
  in `src/router.tsx:40-45,50-58` and the kill publish toggle is active.
- No report/block/moderation implementation exists in `src/`, `components/`, or
  `lib/`; only owner comment deletion is present.
- `appstore/submission.md:110-123` and `LAUNCH-CHECKLIST.md:59-63` already state
  that the current public UGC surface does not meet the intended App Store
  launch requirements and recommend private-only v1.
- There is no feature flag in `.env.example`, `src/router.tsx`, or the form to
  produce that recommended private-only build.

**Required implementation**

Choose one release scope before further polish:

- **Recommended immediate scope:** feature-flag public/social routes, listeners,
  public profile writes, publish UI, comments, follows, and leaderboards off for
  v1; or
- Build report, block, moderation queue/contact, abuse response, and rules/data
  handling before shipping social.

### F-06 — Every signed-in user's profile is silently made public — P1 high

**Evidence**

- `src/providers/portfolio-data-provider.tsx:78-84` calls
  `savePublicProfile(buildPublicProfile(profile))` for every private profile
  snapshot, with no opt-in and regardless of whether the user has published a
  hunt.
- `firestore.rules:382-385` makes these profiles world-readable.
- `lib/firebase/public-social-repository.ts:37-44` makes them searchable and
  directly retrievable.
- The write failure is discarded with `void`, so private UI cannot tell whether
  its public identity is stale.
- `README.md:88-92` still claims public profiles/social discovery are not part of
  the release. The privacy policy discusses explicitly publishing hunts but does
  not disclose automatic public profile creation.

**Required implementation**

Do not write a public profile until the user gives explicit social/publishing
consent. Define how unpublishing the last hunt or disabling social affects the
profile. Surface projection errors and provide a removal path. Migrate/delete
public profiles created without consent.

### F-07 — Publish/unpublish is a chain of partially committed client writes — P1 high

**Evidence**

- `components/kills/kill-editor.tsx:77-228` performs: optional public farm write,
  private draft write, sequential media uploads plus draft rewrites, optional GPX
  upload, final private write, public-profile write, then public hunt publish or
  unpublish. There is no transaction, durable state machine, or reconciliation.
- A publish failure leaves `isPublic: true` on the private record without a
  public projection. An unpublish failure leaves `isPublic: false` while the old
  projection remains public. The catch message says the draft is available even
  when the final private record was already saved.
- `lib/firebase/public-social-repository.ts:23-35` reads all likes/comments and
  deletes them in one batch. The listeners permit 500 likes and 200 comments,
  but a Firestore batch is limited to 500 writes; a sufficiently popular hunt
  cannot be unpublished by this function.
- `components/kills/kill-editor.tsx:225` uses the *previous private kill's*
  `updatedAt` as `publishedAt` when editing a public hunt. It does not preserve
  the actual public document's publication timestamp, so edits reorder the feed
  unpredictably.

**Required implementation**

Use a server-authoritative publish state machine or a transactional/outbox
pattern with explicit `private`, `publishing`, `public`, `unpublishing`, and
`failed` states. Chunk or recursively delete engagement data safely. Preserve an
immutable original `publishedAt` and use `updatedAt` only for edits. Add a
reconciler that enforces source `isPublic/status` against projection existence.

### F-08 — Account cleanup leaves public subcollections and other users' graph data behind — P1 high

**Evidence**

- `lib/firebase/account-deletion.ts:52-60` deletes public hunt parent documents
  but never their `likes` and `comments` subcollections. Firestore parent deletes
  do not cascade.
- `firestore.rules:393-426` grants public reads to those subcollections even when
  the parent no longer exists, so known paths can remain readable.
- Incoming followers are removed only from
  `publicFollowers/{deletedUid}/followers`; the followers' private
  `users/{follower}/following/{deletedUid}` documents remain stale.
- Outgoing follow notifications in other users' inboxes are not removed.
- Engagement created by the deleting user on other people's hunts and related
  notifications is not enumerated.

**Required implementation**

The trusted deletion job must explicitly enumerate all owned and authored data,
including nested public engagement, both sides of follow edges, notifications,
forum content policy, and Storage. Define whether community contributions are
deleted or anonymized, then test that policy.

### F-09 — Edit UI cannot clear optional facts and drops bow loadout facts — P1 high

**Evidence**

- `components/kills/kill-editor.tsx:117-149` omits `loadoutId`,
  `equipmentAttachments`, or `measurement` from the edit when their fields are
  cleared. `applyKillEdit` treats omission as “no change”, so old values silently
  survive. The user cannot actually remove these facts.
- Route handling at lines 78-79 and 193-204 preserves the old GPX unless a new
  one is uploaded; there is no explicit remove-route control.
- `lib/domain/kill-edit.ts:11-29,51-71` has no clear representation for optional
  `loadoutId`, `equipmentAttachments`, or `measurement`, despite the documented
  `undefined` vs `null` edit invariant.
- `lib/domain/armory.ts:57-61,95-99` supports bow `arrow` and `broadhead`
  attachments, but `components/kills/kill-form.tsx:149-163,404-405` copies and
  renders only optic/suppressor/bipod/sling. Selecting a bow loadout therefore
  drops arrow and broadhead snapshots from the hunt.

**Impact**

The UI appears to accept an edit but silently retains or loses factual hunt data,
violating kill-record integrity.

**Acceptance tests**

- Set -> clear -> reload tests for loadout, measurement, attachments, and route.
- Bow loadout submission retains arrow and broadhead name/detail/grain.
- Existing facts remain unchanged only when the user did not request a clear.

### F-10 — Media removal is an orphaning operation, not deletion — P1 high

**Evidence**

- `components/kills/media-picker.tsx:57-65` removes an existing asset from the
  record after a generic confirm.
- `components/kills/kill-editor.tsx:206-222` saves the shortened `media[]` but
  never deletes or quarantines the corresponding Storage object.
- `storage.rules:41-45` makes client deletion impossible.
- There is no permanent-delete flow in trash; `components/kills/trash-view.tsx`
  supports restore only.
- `docs/privacy.html:92-98` says users can delete individual records and their
  media at any time, which the product cannot do.

**Required implementation**

Decide and implement explicit semantics: detach, replace, trash, and permanent
delete are different actions. Preserve record/storage consistency and revoke
public access tokens when media ceases to be public. The privacy policy must
describe the behavior actually shipped.

### F-11 — Initial load is slow because the public route boots the whole app/auth stack — P1 high

**Measured evidence (deployed `https://onfoothunta.vercel.app/`)**

- Lighthouse: performance **64**, FCP **4.9 s**, LCP **6.0 s**, Speed Index
  **6.2 s**, TTI **6.4 s**, TBT **60 ms**, CLS **0**.
- Server response time was only **10 ms**; repeated direct TTFB probes were
  approximately **38-206 ms**. The server is not the main bottleneck.
- First-load transfer was about **760 KiB** across 12 requests.
- Main JS: **1,142,435 bytes raw / ~340,846 bytes transferred**. Lighthouse
  estimated **236,889 bytes (69.5%)** unused on `/`.
- CSS: **176,135 bytes raw / ~32,412 bytes transferred**. Lighthouse estimated
  **21,051 bytes (65.3%)** unused on `/`.
- Brand mark: **207,879 bytes** for a 1254x1254 PNG, including uses rendered at
  24 px.
- Firebase Auth iframe: ~94,931 transferred bytes plus gapi/project-config
  dependencies; Lighthouse's longest chain reached roughly 4.5 s.
- Google Fonts and app CSS were render-blocking with estimated combined savings
  of about **1,560 ms**. LCP was the text heading, with about **2,858 ms** of
  element render delay.

**Code root causes**

- `src/router.tsx:3-25` eagerly imports every page, so route code is in the main
  bundle instead of lazy route chunks.
- `src/app.tsx:7-14` mounts `AuthProvider` for the public landing route.
  `src/pages/home-page.tsx:3,9` invokes `AuthRedirect`, forcing Firebase Auth
  session initialization before/while the public page renders.
- `src/main.tsx:6-9` imports all four global stylesheets for every route.
- `src/styles/globals.css:1-2` imports Tailwind and MapLibre CSS globally even on
  routes that never show a map.
- `index.html:11-15` render-blocks on remote font CSS.
- `components/brand/brand-logo.tsx:3-4,22-39` always references the 208 KiB
  canonical PNG mask regardless of rendered size.

**Required implementation**

1. Lazy-load route modules and place Suspense/loading boundaries at route groups.
2. Make the anonymous landing shell independent of Firebase; only initialize
   auth when needed, or use a non-blocking cached-session handoff that does not
   delay first paint.
3. Scope MapLibre CSS/code to map routes and split page-specific CSS.
4. Revisit font delivery (self-host/subset/preload or system-font first paint)
   and avoid render-blocking remote CSS.
5. Produce approved responsive logo assets while respecting the canonical-logo
   constraint; do not download a 1254px RGBA source for every 24px mark.
6. Set explicit performance budgets in CI for entry JS/CSS and key routes.

**Acceptance target**

Re-run mobile Lighthouse at least three times against preview/production and
record the median. Target a good LCP (<2.5 s), FCP (<1.8 s), and an entry JS
budget agreed by the team; confirm no regression in CLS/TBT.

### F-12 — Authenticated routes create excessive global listeners; feed cards multiply them — P1 high

**Evidence**

- `src/router.tsx:27-34` mounts both `PortfolioDataProvider` and
  `SocialDataProvider` around every private route, including profile, kill edit,
  trash, map, and loadout screens.
- `src/providers/portfolio-data-provider.tsx:75-146` immediately opens four
  snapshots: profile, all kills, all armory items, and all loadouts.
- `src/providers/social-data-provider.tsx:15-20` adds the latest 100 public hunts
  and the user's following list even on screens that do not use social data.
- `src/pages/home-feed-page.tsx:9,15` adds a notifications listener.
- Every `HuntPostCard` calls `useHuntEngagement` at
  `components/social/hunt-post-card.tsx:26-32`; the hook opens a likes snapshot
  and comments snapshot at `lib/hooks/use-engagement.ts:21-25`.
- A 50-card feed therefore opens about 100 engagement listeners in addition to
  the global listeners and loads up to 500 likes plus 200 comments per card.

**Impact**

Load time and Firestore read cost grow with visible feed length and account data.
This explains why slowness appears only for some accounts/screens rather than on
every cold launch.

**Required implementation**

Scope providers/listeners to the routes that consume them. Query paginated feed
summaries with denormalized like/comment counts, and subscribe to full engagement
only on an opened hunt/comments screen (or a very small visible window). Limit
and paginate private collections as they grow. Add instrumentation for listener
count, first snapshot timing, document reads, and image bytes per route.

### F-13 — Global 100-hunt cap makes feeds and leaderboards incorrect — P1 high

**Evidence**

- `lib/firebase/public-social-repository.ts:47-49` subscribes to only the latest
  100 public hunts globally.
- `src/pages/home-feed-page.tsx:17-19` filters that already-truncated global set
  by following IDs on the client. Once the community exceeds 100 recent hunts, a
  followed hunter's posts—and even the viewer's own posts—can disappear from the
  home feed.
- `components/social/social-leaderboard.tsx` ranks the same truncated list, so it
  is not a leaderboard of all published records.
- `lib/domain/public-social.ts:49-50` and
  `components/portfolio/leaderboard-view.tsx:8-15` compare raw numeric scores
  without separating `scoreUnit` or `scoringSystem`. Inches, centimetres, points,
  SCI, and Rowland Ward values can be ranked against one another as though they
  were equivalent.
- There is no pagination/cursor logic on discover, feed, profile, farm, or
  leaderboard paths.

**Required implementation**

Use server-queryable feed documents keyed by followed owners (with a deliberate
fan-out/fan-in design), cursor pagination, and explicit empty/end/error states.
Leaderboard partitions must include species + scoring system + normalized/valid
unit; never compare incomparable factual measurements.

### F-14 — Privacy and launch URLs/claims are currently invalid — P1 high

**Evidence**

- Live probe on 2026-07-11:
  `https://armindobento1.github.io/hunta/privacy.html` returned **404** while the
  marketing root returned 200.
- The broken URL is the configured Privacy Policy URL in
  `appstore/submission.md:18-28` and the expected live URL in
  `LAUNCH-CHECKLIST.md:41-47`.
- `docs/privacy.html:92-98` promises individual record/media deletion and total
  account deletion; the former is not implemented and the latter is broken by
  F-03/F-08.
- `docs/privacy.html:79-90` says per-user rules prevent any other user from
  reading records, but public profiles/hunts/farms and exact locations are active.
- `README.md:88-92` says public profiles/friends/social discovery are absent,
  which is false for the current route tree.

**Required implementation**

Do not submit or release until the live privacy URL returns 200 from the actual
Pages source branch and its text matches shipped behavior. Update stale README,
launch checklist status, and App Store pack in one documentation pass after code
and release-scope decisions are final.

### F-15 — Comment likes can be inflated with duplicate UIDs — P2 medium

**Evidence**

- `firestore.rules:262-267` converts before/after lists to sets to verify that the
  caller added their own UID.
- `firestore.rules:417-420` separately checks only that the raw list size is at
  most 5000.
- A malicious client can update `likedBy` from `[]` to thousands of copies of its
  own UID. The set difference is exactly `{caller}`, so the rule accepts it while
  UI count uses raw array length (`components/social/hunt-engagement.tsx:26`).
- Existing tests use `arrayUnion`, which cannot reproduce duplicate-list input.

**Required implementation**

Prefer one like document per user (the same model already used for hunt likes),
or enforce raw-list uniqueness and exact size delta in rules. Add an emulator
test that writes duplicate UIDs directly and expects denial.

### F-16 — Rules do not validate media entries or canonical public-source linkage — P2 medium

**Evidence**

- `firestore.rules:142-178` validates only that private `media` is a list with at
  most 30 entries. It does not validate entry keys, types, file sizes, cover
  membership, or that each `storagePath` belongs to the owner/kill.
- `firestore.rules:214-225` similarly accepts unvalidated public media entries and
  does not prove the public document corresponds to an existing source kill with
  `isPublic == true` and active status.
- The Zod client schema has stronger checks, but rules must assume a modified
  client.

**Required implementation**

Mirror the invariant-relevant media and cover constraints in rules, constrain
public media URLs/origins according to the final media architecture, and make
public projection writes server-authoritative or prove source linkage in rules.
Add malicious-client tests rather than only SDK-happy-path tests.

### F-17 — Direct-link back buttons can do nothing; public route owner parameters are ignored — P2 medium

**Evidence**

- Public hunt/comments routes contain both `:uid` and `:publicHuntId` at
  `src/router.tsx:43-44`.
- `src/pages/public-hunt-page.tsx:7` and
  `src/pages/hunt-comments-page.tsx:8-16` ignore `uid` and fetch only by hunt ID.
  A URL under one person's path can render another owner's hunt if the hunt ID is
  valid, creating misleading/non-canonical links.
- Back controls call `navigate(-1)` without a fallback on public profile, hunt,
  comments, follower/following, and other screens. Opening a shared deep link in
  a fresh tab/native history can leave the button with nowhere useful to go.
- `components/providers/navigation-gestures.tsx:11-14,24-33` already has a
  history-index guard, but page-level back controls do not use it.

**Required implementation**

Validate `hunt.ownerId === uid` and show not-found/redirect to the canonical URL
on mismatch. Centralize safe back navigation with an explicit route fallback.
Test direct-entry navigation with history index zero.

### F-18 — Search/farm lookup has avoidable races and scaling ceilings — P2 medium

**Evidence**

- `components/kills/location-fields.tsx:55-66` lets an aborted older search run
  `.finally(() => setSearching(false))`, which can hide the loading state while a
  newer request is still active. It does not clear a previous error on a new
  successful query.
- `lib/firebase/farm-repository.ts:37-47` downloads up to 300 farm documents for
  a country (or globally), then computes distance on the client. Results beyond
  that arbitrary first 300 can never be suggested, and reads grow heavily.
- `lib/firebase/follow-repository.ts:52-64` resolves people with one public
  profile read per ID and has no pagination; large follower lists become an
  N+1 request burst.

**Required implementation**

Use request IDs/abort-aware state for search, geospatial indexing/querying for
nearby farms, and paginated/batched profile summaries for follow lists.

### F-19 — Accessibility and SEO regressions are measurable on the public page — P2 medium

**Evidence**

- Lighthouse accessibility score: **94**. It found insufficient contrast for
  `.eyebrow` (`#a8823c` on `#faf7f1`, 3.31:1 at 12px) and welcome body copy
  (`#8b8172` on `#faf7f1`, 3.58:1).
- Lighthouse SEO score: **91**. `/robots.txt` is rewritten to the SPA HTML, so
  Lighthouse reported 24 invalid robots directives.
- `/favicon.ico` also resolves to SPA HTML rather than a real icon.
- Dialog-like overlays (`TrashDialog`, armory picker/save sheets) declare dialog
  roles but do not consistently manage initial focus, focus containment, Escape,
  or focus restoration.

**Required implementation**

Correct token contrast to WCAG AA, add real static `robots.txt` and favicon/app
icons outside the SPA fallback, and use a shared accessible dialog/sheet primitive
with keyboard/focus behavior. Re-run accessibility on authenticated core flows,
not only `/`.

### F-20 — Static and developer links contain broken or circular destinations — P3 low

**Evidence**

- Internal React route literals all correspond to declared routes; no missing
  app-route literal was found.
- `README.md:39` tells developers to open `http://localhost:3000`, but the Vite
  config does not set a port; default `npm run dev` uses 5173.
- `docs/index.html:70,94` “Create Your Portfolio” links merely scroll to
  `#create`; inside that section, line 372 sends the same CTA back to `#top`
  instead of the production app/auth route. The primary conversion flow is a
  loop, not account creation.
- The production privacy link is broken as documented in F-14.

**Required implementation**

Point landing CTAs to the approved app/auth URL, correct the local development
port or configure it explicitly, and add an automated internal-link/file check
for `docs/` plus live launch-URL smoke checks.

### F-21 — Test suite is green but misses the highest-risk integration paths — P2 medium

**Evidence**

The suite has 106 unit/component tests and 20 rules tests, but there are no tests
covering:

- public-hunt cross-owner update takeover;
- public location redaction/rejection;
- public kill -> trash -> unpublish -> restore behavior;
- failed publish/unpublish reconciliation;
- account deletion with Storage files and active subscriptions;
- recursive deletion of public engagement and both sides of follow edges;
- duplicate comment-like UIDs;
- clear semantics for optional kill fields and route;
- bow loadout arrow/broadhead snapshot round-trip;
- feed correctness beyond 100 global hunts;
- score-system/unit partitioning;
- direct-entry back navigation and public owner/path mismatch;
- performance budgets or listener-count/read-cost budgets.

**Required implementation**

Add failing tests for each finding before implementing its fix. Do not weaken
strict schemas or rules to make integration tests pass. Rules changes require
both allowed-owner and denied-cross-user/malicious-client cases.

## Verification evidence

Commands run from repository root:

- [x] `npm run typecheck` — pass.
- [x] `npm run lint` — pass.
- [x] `npm run test` — 24 files, 106 tests passed.
- [x] `npm run build` — pass; Vite warned that the main and MapLibre chunks exceed
  500 kB minified.
- [x] `JAVA_HOME=/opt/homebrew/opt/openjdk@21 PATH=/opt/homebrew/opt/openjdk@21/bin:$PATH npm run test:rules`
  — 2 files, 20 tests passed. The first plain run failed because the shell default
  was Java 11; rerunning with the documented Java 21 installation passed.
- [x] `npm audit --omit=dev` — 0 known vulnerabilities.
- [x] Production URL probes — Vercel app 200, GitHub Pages landing 200, privacy
  URL 404, Firebase auth handler 200.
- [x] Lighthouse against deployed `/` — results recorded under F-11/F-19.

Production build observations:

| Asset | Raw | Gzip/transfer |
|---|---:|---:|
| Main JS | ~1,143 kB | ~339 kB |
| MapLibre JS chunk (lazy) | ~1,028 kB | ~273 kB |
| Global CSS | ~165-176 kB | ~29-32 kB |
| Hunta mark PNG | ~208 kB | ~208 kB |

The current Git worktree was clean before this audit file was added. No app code
was changed.

## Required implementation order

Claude should not address these as one broad refactor. Use this order and keep
each safety change separately reviewable:

1. **Release containment:** decide/implement private-only feature flag or stop
   public release paths (F-01, F-05, F-06).
2. **Rules emergency patch:** public-hunt takeover plus malicious-client tests
   (F-02), then comment-like/media hardening (F-15, F-16).
3. **Visibility state integrity:** trash/unpublish and publish reconciliation
   (F-04, F-07), including migration of stale/precise public data.
4. **Account/media deletion redesign:** trusted deletion job and complete graph/
   subcollection cleanup (F-03, F-08, F-10).
5. **Kill edit integrity:** explicit clear semantics and full bow snapshot support
   (F-09).
6. **Feed correctness and cost:** query design, pagination, score partitions,
   provider/listener scope (F-12, F-13, F-18).
7. **Load performance:** route/auth/CSS/font/logo work with budgets and repeated
   measurement (F-11).
8. **Navigation, accessibility, SEO, links, and documentation** after behavior is
   final (F-14, F-17, F-19, F-20).

After every rules or `lib/firebase/` change, run all five repository gates,
including `test:rules` with Java 21. After each implementation response, list
findings addressed, skipped items and reasons, files touched, migrations needed,
and exact verification output.

## Re-review

Not yet performed. All findings remain open.

## Sign-off

Not signed off. Codex must re-review implemented changes and production/privacy
deployment evidence before closing this audit.
