# Audit response: Full Hunta codebase — v1.2 (implementation pass 1)

- **Author:** claude-code
- **Role:** implementer
- **Date:** 2026-07-11
- **Responds to:** `audit/codex/audit-v1.1.md`
- **Status:** open — awaiting Codex re-review (implementer never signs off)

Numbering note: the user forced the auditor file to `v1.1`, inverting the
normal even/odd parity for this topic. For this topic only: odd decimals =
auditor (Codex), even decimals = implementer (Claude Code).

## Scope of this pass

Audit steps **1** (release containment) and **2, first half** (rules emergency
patch) from the required implementation order. Everything else remains open —
see "Skipped" below.

## Findings addressed

### F-01 / F-05 / F-06 — release containment (partial for F-01, see skips)

Added a `VITE_SOCIAL_ENABLED` feature flag (`lib/features.ts`), **off unless
the env var is exactly `"true"`**, so every default build (local, CI, Vercel —
the var is not set anywhere) is private-only:

- `src/router.tsx` — all public routes (`/people/*`, `/farms/*`) and all
  signed-in social routes (`/home`, `/discover`, `/notifications`,
  `/portfolio/leaderboard` — the leaderboard page renders the *public
  community* leaderboard) are excluded from the route tree;
  `SocialDataProvider` (100-hunt + following listeners) is not mounted.
- `components/auth/auth-redirect.tsx` — signed-in users land on `/portfolio`
  instead of the social `/home` feed.
- `components/portfolio/bottom-nav.tsx` — Home and Discover tabs hidden.
- `components/portfolio/profile-header.tsx` — `FollowStats` (publicFollowers
  listeners + `/people` links) hidden.
- `components/kills/kill-form.tsx` — the "Publish publicly" toggle and its
  section do not render (F-01 req. 1, F-05).
- `components/kills/kill-editor.tsx` — **all** public writes are gated:
  public farm creation (`ensureFarm`), `savePublicProfile`, `publishHunt`,
  `unpublishHunt`. A failed save can no longer create a public farm pin
  because no farm is created at all in this build.
- `src/providers/portfolio-data-provider.tsx` — the automatic
  `savePublicProfile` on every profile snapshot no longer runs (F-06: no
  public profile is written without the flag; the consent flow itself is
  still owed when social returns).

Behavior notes:
- A private kill that was previously published keeps its `isPublic` fact
  untouched (no silent mutation of user data); the projection is simply never
  written to. Existing stale/precise public documents still require the
  migration/removal decision (skipped, below).
- `findFarmsNear` (read-only farm suggestions in the kill form) was left
  functional; it creates nothing and reads a collection that this build can
  no longer add to.

### F-02 — public hunt takeover (fixed)

`firestore.rules` `publicHunts` match rewritten:
- **create** — `validPublicHunt` plus the canonical ID binding
  `publicHuntId == request.auth.uid + '_' + sourceKillId`, so nobody can
  create a projection at a path encoding another hunter's UID.
- **update** — split from create; requires `resource.data.ownerId ==
  request.auth.uid` **and** immutability of `ownerId`, `sourceKillId`, and
  `publishedAt` (`id` is already pinned by `validPublicHunt`).
- **delete** — unchanged (existing-owner check).

New rules test "denies takeover, mutation, or deletion of another hunter's
public hunt" covers: guest read, attacker full-replacement takeover, attacker
update/delete, attacker create at a victim-prefixed path, owner field edit
(allowed), owner mutation of `sourceKillId`/`publishedAt` (denied), owner
delete (allowed).

Known consequence, deliberate: the current client publish-edit path sends a
recomputed `publishedAt` (`kill-editor.tsx:225`, the F-07 feed-reordering
bug), which these rules would now reject. That path is dead code while
`VITE_SOCIAL_ENABLED` is off; F-07's publish state machine must fix the client
before social is re-enabled.

### F-15 — comment-like inflation with duplicate UIDs (fixed)

`commentLikeToggle()` now also requires the **raw list** size to change by
exactly one. Comments are created with `likedBy == []` (already enforced), so
by induction the list stays duplicate-free and counts cannot be inflated.
New rules test writes duplicate UIDs directly (not via `arrayUnion`) and
expects denial; also proves a user cannot swap out someone else's like.

## Pass 2 (same session): F-01 fixed properly — text-only public location

Product decision by the user: **social ships**, and the public location is
**farm name + area as text** so hunters can find the farm themselves. The
release plan is fix-then-launch, not private-only. Implemented:

- `lib/domain/public-social.ts` — new strict `publicLocationSchema`
  (`placeName` + optional `farmName`, nothing else). `buildPublicHunt`
  constructs the location explicitly (never spreads the private one), so
  coordinates, `farmId`, and geocoder `source` cannot leak. Domain test
  asserts the serialized projection contains none of them.
- `firestore.rules` — new `validPublicLocation` with `hasOnly(['placeName',
  'farmName'])`; `validPublicHunt` uses it, so a modified client cannot
  publish coordinates either. The `farms` collection is **retired and fully
  locked** (`allow read, write: if false`) — farm docs carry exact
  coordinates and were world-readable. `validFarm` removed. Rules tests:
  redaction denials (lat/lng, farmId, source) + farms lockdown.
- Farm ecosystem retired from active source (archived to
  `archive/social-farms/`): `farm-page.tsx`, `farm-view.tsx`,
  `public-hunts-map.tsx` (plotted public hunts by exact coords),
  `lib/firebase/farm-repository.ts`. `/farms/:farmId` route removed; the
  public profile's map tab removed (grid remains). Farm *suggestions* in the
  kill form are unwired (the optional prop is no longer passed);
  `lib/domain/farm.ts` stays for its types. All social text UI already
  rendered `farmName || placeName`, so feeds/cards/leaderboard work unchanged.
- **F-07 partial:** `getPublishedAt` reads the existing projection's original
  publication time (raw read, tolerant of legacy shape) and the editor
  republishes edits with it — required by the new `publishedAt` immutability
  rule, and it stops edits from re-dating the feed.
- Feed/list reads (`subscribeToPublicHunts`, `getPublicHuntsByOwner`,
  `getPublicHunt`) now **skip documents that fail the schema** with a console
  warning instead of throwing: pre-redaction docs must never render, and one
  bad community doc must not kill everyone's feed. Deliberate, logged.
- `vitest.config.ts` pins `VITE_SOCIAL_ENABLED=false` for the unit suite so
  tests always validate the release default even when a developer's
  `.env.local` enables social for local dev.

**Most urgent remaining exposure:** `publicHunts` documents published before
this change still carry exact coordinates and remain world-readable by rule
(reads stay open; the dev flag-on client needs them, and prod has no
social consumers while the flag is off). They need an admin migration
(sanitize or delete) — or the owner editing/republishing each hunt, which now
heals the doc — **before** the flag is enabled in production.

## Skipped in this pass (and why)

- **F-01 items 2–5** (public location schema, coarse projection, rules
  rejection of precise coords, farm ID scheme, migration/removal of already
  published precise documents) — these need the product decision on what a
  safe public location looks like; containment (no client can render or write
  the surface) is in place. **The migration of existing exposed documents is
  the most urgent open item**: nothing in this pass removes data already in
  `publicHunts`/`farms`, and those collections remain world-readable by rule.
  If private-only v1 is confirmed, consider flipping the public `allow read`
  rules to `false` as interim containment — one-line change each, nothing in
  the flag-off client reads them.
- **F-16** (media entry validation in rules, source-linkage proof) — bundled
  into the media architecture decision; not a quick patch.
- **F-03, F-04, F-07–F-14, F-17–F-21** — later steps of the required order,
  untouched.
- Rules deploy: `firestore.rules` changes take effect only after
  `firebase deploy --only firestore:rules` — not done (deploys are the
  user's call).

## Files touched

- `lib/features.ts` (new), `.env.example`
- `src/router.tsx`, `src/providers/portfolio-data-provider.tsx`
- `components/auth/auth-redirect.tsx`, `components/portfolio/bottom-nav.tsx`,
  `components/portfolio/profile-header.tsx`
- `components/kills/kill-form.tsx`, `components/kills/kill-editor.tsx`
- `firestore.rules`
- `tests/rules/firestore.rules.test.ts` (+2 malicious-client tests)
- `tests/app/router.test.tsx` (social paths must be unrouted),
  `tests/app/auth-navigation.test.tsx` (redirect → `/portfolio`),
  `tests/components/kill-form.test.tsx` (publish toggle must be absent)

## Verification

- [x] `npm run typecheck` — pass
- [x] `npm run lint` — pass
- [x] `npm run test` — 24 files, 112 tests, pass
- [x] `npm run build` — pass (pre-existing >500 kB chunk warning, F-11)
- [x] `npm run test:rules` (Java 21) — 2 files, 22 tests, pass
