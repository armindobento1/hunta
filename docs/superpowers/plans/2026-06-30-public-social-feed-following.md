# Public Social Feed and Following Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add opt-in public hunt publishing, public account search, follows, Discover/Following feeds, public profiles, and public leaderboards without exposing private source records.

**Architecture:** Private kills remain authoritative under each UID. A deterministic public projection stores only approved fields, while separate public-profile and authenticated follow documents support discovery. UI consumes those projections through focused repositories and hooks.

**Tech Stack:** React, TypeScript, Firebase Auth/Firestore, Zod, Vitest, Firebase Rules Emulator, Vercel.

---

### Task 1: Public social domain

**Files:**
- Create: `lib/domain/public-social.ts`
- Create: `tests/domain/public-social.test.ts`

- [ ] Write failing tests proving projection IDs are deterministic, public facts are copied, private persistence fields are excluded, names normalize for prefix search, and published scores rank by species.
- [ ] Run `npm test -- tests/domain/public-social.test.ts` and confirm failures are caused by missing domain APIs.
- [ ] Implement Zod schemas, `buildPublicHunt`, `normalizeSearchName`, and ranking selectors.
- [ ] Re-run the focused tests and confirm they pass.

### Task 2: Firestore repositories and ownership rules

**Files:**
- Create: `lib/firebase/public-social-repository.ts`
- Create: `lib/firebase/follow-repository.ts`
- Modify: `firestore.rules`
- Modify: `firestore.indexes.json`
- Modify: `tests/rules/firestore.rules.test.ts`

- [ ] Add failing rule tests for public reads, owner-only projection writes, cross-user private kill denial, and follower-only follow writes.
- [ ] Run `npm run test:rules` with Java 21 and verify the new tests fail.
- [ ] Add public profile/hunt validation, public reads, owner-only writes, and authenticated follow-edge rules.
- [ ] Implement repository APIs for profile projection, publish/unpublish, account prefix search, recent/owner public hunts, follow/unfollow, and following subscriptions.
- [ ] Re-run rule tests and confirm they pass.

### Task 3: Publishing lifecycle

**Files:**
- Modify: `lib/domain/kill.ts`
- Modify: `lib/domain/kill-edit.ts`
- Modify: `components/kills/types.ts`
- Modify: `components/kills/kill-form.tsx`
- Modify: `components/kills/kill-editor.tsx`
- Modify: `tests/components/kill-form.test.tsx`

- [ ] Add a failing form test for the publish checkbox and GPS/farm warning.
- [ ] Run the focused form test and verify it fails.
- [ ] Add `isPublic` to the private Kill schema/edit flow, default false for new records, and render the publishing control.
- [ ] After private save, upsert or delete the public projection using the current public profile summary; preserve the private record if projection sync fails.
- [ ] Re-run focused tests and confirm they pass.

### Task 4: Account search and follows

**Files:**
- Create: `components/social/account-search.tsx`
- Create: `components/social/follow-button.tsx`
- Create: `lib/hooks/use-social.ts`
- Create: `src/providers/social-data-provider.tsx`
- Modify: `src/router.tsx`
- Create: `tests/components/social.test.tsx`

- [ ] Add failing UI tests for two-character search, result rendering, and follow/unfollow state.
- [ ] Run focused tests and verify expected failures.
- [ ] Implement debounced prefix search, follow controls, and authenticated social state.
- [ ] Re-run focused tests and confirm they pass.

### Task 5: Social feed, leaderboard, and public profiles

**Files:**
- Create: `components/social/social-feed.tsx`
- Create: `components/social/public-profile-view.tsx`
- Create: `components/social/public-hunt-detail.tsx`
- Modify: `components/portfolio/portfolio-dashboard.tsx`
- Modify: `components/portfolio/leaderboard-view.tsx`
- Create: `src/pages/public-profile-page.tsx`
- Create: `src/pages/public-hunt-page.tsx`
- Modify: `src/pages/leaderboard-page.tsx`
- Modify: `src/router.tsx`
- Modify: `tests/components/portfolio.test.tsx`
- Modify: `tests/components/explore-views.test.tsx`

- [ ] Add failing tests for Discover/Following switching, hunter identity links, account search on feed and leaderboard, public profile hunts, and read-only public detail.
- [ ] Run focused tests and verify expected failures.
- [ ] Implement the social views and public routes while retaining the owner's My Hunts view.
- [ ] Re-run focused tests and confirm they pass.

### Task 6: Styling, docs, verification, and deployment

**Files:**
- Modify: `src/styles/design-v2.css`
- Modify: `vault/0-Overview/Data-Model.md`
- Modify: `vault/0-Overview/System-Architecture.md`
- Modify: `vault/Frontend/Portfolio-v1.md`

- [ ] Add mobile-first styling for search, feed modes, follow buttons, public profiles, warnings, and leaderboard identities.
- [ ] Update the vault once with the public-projection privacy boundary and social data flow.
- [ ] Run `npm run typecheck`, `npm run lint`, `npm test`, Java 21 `npm run test:rules`, and `npm run build`.
- [ ] Smoke-test public routes and signed-out public reads in the in-app browser.
- [ ] Deploy Firestore rules/indexes and the Vercel production build; verify the production alias.
