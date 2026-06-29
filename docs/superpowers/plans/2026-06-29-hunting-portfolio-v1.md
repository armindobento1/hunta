# Hunting Portfolio v1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build, test, secure, deploy, and publish a private multi-user hunting portfolio with Firebase-backed accounts, records, media, and GPX routes.

**Architecture:** Next.js App Router renders a mobile-first interface while client-side Firebase adapters handle Auth, Firestore, and Storage behind domain-focused repositories. Pure TypeScript modules validate kill facts, preserve attachments during edits, group/order portfolio views, and derive route metrics from raw GPX. Firebase rules enforce the same `users/{uid}` ownership boundary for documents and files.

**Tech Stack:** Next.js, TypeScript, React, Tailwind CSS, Firebase Web SDK, Firebase Emulator Suite, MapLibre GL JS, React Hook Form, Zod, Vitest, Testing Library, Lucide React, Vercel.

---

## File map

- `app/`: root layout, authentication, portfolio, record editor, record detail,
  trash, loading, and not-found routes.
- `components/auth/`: sign-in/sign-up UI and auth guard.
- `components/portfolio/`: profile header, statistics, tabs, cards, grouping, and
  empty state.
- `components/kills/`: record form, media picker, GPX picker, location fields,
  detail sections, and trash confirmation.
- `components/map/`: browser-only MapLibre route view.
- `components/ui/`: focused shared controls used by the feature components.
- `data/`: typed onboarding/example copy only; no fabricated user records.
- `lib/domain/`: authoritative kill/profile schemas, edit semantics, and
  selectors.
- `lib/gpx/`: XML parsing and distance/duration/bounds derivation.
- `lib/firebase/`: client initialization, auth, repositories, and uploads.
- `lib/hooks/`: auth, portfolio, profile, and online-state hooks.
- `firestore.rules`, `storage.rules`: per-user authorization and validation.
- `tests/`: unit, component, and Firebase emulator security tests.

## Task 1: Scaffold the application and test harness

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `next.config.ts`
- Create: `postcss.config.mjs`
- Create: `eslint.config.mjs`
- Create: `vitest.config.ts`
- Create: `tests/setup.ts`
- Create: `app/layout.tsx`
- Create: `app/globals.css`
- Create: `app/page.tsx`
- Modify: `.gitignore`

- [ ] **Step 1: Add a failing smoke test**

Create `tests/app/page.test.tsx` that renders `HomePage` and expects the product
name and authentication entry point.

```tsx
import { render, screen } from "@testing-library/react";
import HomePage from "@/app/page";

it("introduces the private hunting portfolio", () => {
  render(<HomePage />);
  expect(screen.getByRole("heading", { name: /your hunts, remembered/i })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /get started/i })).toHaveAttribute("href", "/auth");
});
```

- [ ] **Step 2: Install the selected stack and run the test red**

Run: `npm install next react react-dom firebase maplibre-gl react-hook-form zod @hookform/resolvers lucide-react clsx tailwind-merge`

Run: `npm install -D typescript @types/node @types/react @types/react-dom tailwindcss @tailwindcss/postcss eslint eslint-config-next vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event firebase-tools @firebase/rules-unit-testing`

Run: `npm test -- tests/app/page.test.tsx`

Expected: FAIL because the app scaffold does not exist.

- [ ] **Step 3: Add the minimal Next.js scaffold**

Use App Router scripts for `dev`, `build`, `start`, `lint`, `typecheck`, `test`,
`test:watch`, and `test:rules`. Configure `@/*`, jsdom, Testing Library setup,
Tailwind, metadata, fonts, and the welcome route. Ignore `.superpowers/`,
`.firebase/`, `firebase-debug.log`, and emulator export data.

- [ ] **Step 4: Run the smoke test green**

Run: `npm test -- tests/app/page.test.tsx`

Expected: PASS, 1 test.

## Task 2: Define and protect the domain model

**Files:**
- Create: `lib/domain/profile.ts`
- Create: `lib/domain/kill.ts`
- Create: `lib/domain/kill-edit.ts`
- Create: `tests/domain/kill.test.ts`
- Create: `tests/domain/kill-edit.test.ts`

- [ ] **Step 1: Write schema and edit regression tests**

Tests must reject missing species/date/time/location/weapon/ammunition, enforce
rifle caliber versus bow type, reject a cover ID outside `media`, accept a
recoverable draft without a cover, and prove that a partial edit preserves
existing media, route, location, weapon, and ownership.

```ts
const updated = applyKillEdit(existingKill, { description: "Updated story" });
expect(updated.media).toEqual(existingKill.media);
expect(updated.route).toEqual(existingKill.route);
expect(updated.location).toEqual(existingKill.location);
expect(updated.ownerId).toBe(existingKill.ownerId);
```

- [ ] **Step 2: Run tests red**

Run: `npm test -- tests/domain/kill.test.ts tests/domain/kill-edit.test.ts`

Expected: FAIL because domain modules do not exist.

- [ ] **Step 3: Implement discriminated schemas and patch semantics**

Define `Profile`, `MediaAsset`, `KillLocation`, `Rifle`, `Bow`, `Ammunition`,
`RouteMetadata`, `Kill`, `KillDraft`, and `KillEdit`. Use strict Zod schemas and
an edit allow-list that cannot mutate `id`, `ownerId`, or `createdAt`.

- [ ] **Step 4: Run domain tests green**

Run: `npm test -- tests/domain/kill.test.ts tests/domain/kill-edit.test.ts`

Expected: PASS.

## Task 3: Implement feed ordering, grouping, and profile statistics

**Files:**
- Create: `lib/domain/selectors.ts`
- Create: `tests/domain/selectors.test.ts`

- [ ] **Step 1: Write selector tests**

Cover date/time descending order, time tie-breaking, exclusion of draft/trash,
country/place/derived-year grouping, unique-country counts, kill counts, and
distance totals that ignore missing routes.

```ts
expect(sortActiveKills([older, trashed, newer]).map((kill) => kill.id)).toEqual([
  newer.id,
  older.id,
]);
expect(groupKillsByLocation([cape2025, cape2024])).toMatchObject({
  "South Africa": { "Eastern Cape": { "2025": [cape2025], "2024": [cape2024] } },
});
```

- [ ] **Step 2: Run tests red**

Run: `npm test -- tests/domain/selectors.test.ts`

Expected: FAIL because selectors do not exist.

- [ ] **Step 3: Implement pure selectors**

Compare `${date}T${killTime}` without locale-dependent parsing, derive years
from ISO dates, and return new arrays/objects without mutating records.

- [ ] **Step 4: Run selector tests green**

Run: `npm test -- tests/domain/selectors.test.ts`

Expected: PASS.

## Task 4: Parse GPX without changing the source

**Files:**
- Create: `lib/gpx/types.ts`
- Create: `lib/gpx/haversine.ts`
- Create: `lib/gpx/parse-gpx.ts`
- Create: `tests/fixtures/valid-route.gpx`
- Create: `tests/fixtures/no-times.gpx`
- Create: `tests/gpx/parse-gpx.test.ts`

- [ ] **Step 1: Write GPX derivation tests**

Verify original text equality, ordered point extraction, known Haversine
distance, earliest/latest duration, bounds, missing-duration behavior, and
specific malformed/no-track errors.

```ts
const result = parseGpx(rawFixture);
expect(result.rawGpx).toBe(rawFixture);
expect(result.distanceKm).toBeCloseTo(1.11, 1);
expect(result.durationMin).toBe(10);
```

- [ ] **Step 2: Run GPX tests red**

Run: `npm test -- tests/gpx/parse-gpx.test.ts`

Expected: FAIL because GPX modules do not exist.

- [ ] **Step 3: Implement browser-safe XML parsing and derivation**

Use `DOMParser`, validate parser errors, accept `trkpt` and `rtept`, skip no
coordinate fabrication, compute Haversine segments, and return `durationMin:
null` when timestamps are absent.

- [ ] **Step 4: Run GPX tests green**

Run: `npm test -- tests/gpx/parse-gpx.test.ts`

Expected: PASS.

## Task 5: Add Firebase initialization, repositories, and secure rules

**Files:**
- Create: `.env.example`
- Create: `firebase.json`
- Create: `.firebaserc.example`
- Create: `firestore.indexes.json`
- Create: `firestore.rules`
- Create: `storage.rules`
- Create: `lib/firebase/config.ts`
- Create: `lib/firebase/auth.ts`
- Create: `lib/firebase/profile-repository.ts`
- Create: `lib/firebase/kill-repository.ts`
- Create: `lib/firebase/storage-repository.ts`
- Create: `tests/rules/firestore.rules.test.ts`
- Create: `tests/rules/storage.rules.test.ts`

- [ ] **Step 1: Write rule tests first**

Use two authenticated emulator contexts plus an unauthenticated context. Prove
owner CRUD, cross-user denial, unauthenticated denial, `ownerId` immutability,
UID path boundaries, valid media/GPX uploads, and invalid type/size denial.

```ts
await assertSucceeds(ownerDb.doc("users/owner/kills/kill-1").set(validKill));
await assertFails(otherDb.doc("users/owner/kills/kill-1").get());
await assertFails(ownerDb.doc("users/owner/kills/kill-1").update({ ownerId: "other" }));
```

- [ ] **Step 2: Run rule tests red**

Run: `npm run test:rules`

Expected: FAIL because Firebase configuration and rules do not exist.

- [ ] **Step 3: Implement strict rules and adapters**

Initialize Firebase once from validated `NEXT_PUBLIC_FIREBASE_*` variables.
Provide auth actions for Google popup/redirect, email sign-up/sign-in, password
reset, and sign-out. Repositories always receive an explicit UID and address
only that user's paths. Uploads use resumable tasks, sanitized names, content
validation, and stable storage paths. Rules limit images to 15 MB, videos to
250 MB, and GPX to 10 MB.

- [ ] **Step 4: Run rule tests green and audit rules**

Run: `npm run test:rules`

Expected: PASS for Firestore and Storage suites.

Run the `firebase-security-rules-auditor` skill against both rules files and fix
all high-confidence findings before continuing.

## Task 6: Build authentication and application shell

**Files:**
- Create: `components/providers/app-providers.tsx`
- Create: `lib/hooks/use-auth.ts`
- Create: `components/auth/auth-card.tsx`
- Create: `components/auth/auth-guard.tsx`
- Create: `components/ui/button.tsx`
- Create: `components/ui/input.tsx`
- Create: `components/ui/form-field.tsx`
- Create: `components/ui/spinner.tsx`
- Create: `app/auth/page.tsx`
- Create: `app/portfolio/layout.tsx`
- Create: `tests/components/auth-card.test.tsx`

- [ ] **Step 1: Write auth interaction tests**

Test sign-in/sign-up switching, email validation, disabled pending state,
Firebase code-to-message mapping, Google action, and password reset.

- [ ] **Step 2: Run tests red**

Run: `npm test -- tests/components/auth-card.test.tsx`

Expected: FAIL because auth UI does not exist.

- [ ] **Step 3: Implement auth UI and guard**

Match the approved welcome screen, expose accessible labels/status messages,
redirect authenticated users to `/portfolio`, and redirect signed-out portfolio
routes to `/auth` without flashing private content.

- [ ] **Step 4: Run auth tests green**

Run: `npm test -- tests/components/auth-card.test.tsx`

Expected: PASS.

## Task 7: Build the portfolio feed and location grouping

**Files:**
- Create: `lib/hooks/use-kills.ts`
- Create: `lib/hooks/use-profile.ts`
- Create: `components/portfolio/profile-header.tsx`
- Create: `components/portfolio/portfolio-tabs.tsx`
- Create: `components/portfolio/kill-card.tsx`
- Create: `components/portfolio/feed-view.tsx`
- Create: `components/portfolio/location-view.tsx`
- Create: `components/portfolio/empty-portfolio.tsx`
- Create: `components/portfolio/bottom-nav.tsx`
- Create: `app/portfolio/page.tsx`
- Create: `tests/components/portfolio.test.tsx`

- [ ] **Step 1: Write portfolio rendering tests**

Test empty guidance, correct sorted cards, list/grid switching, location
headings, derived statistics, links to detail/add/profile, and exclusion of
draft/trash.

- [ ] **Step 2: Run tests red**

Run: `npm test -- tests/components/portfolio.test.tsx`

Expected: FAIL because portfolio components do not exist.

- [ ] **Step 3: Implement approved responsive portfolio**

Translate the supplied light/dark palette, card treatments, segmented controls,
profile statistics, and bottom navigation into reusable responsive components.
Use optimized media URLs without inventing seed records.

- [ ] **Step 4: Run portfolio tests green**

Run: `npm test -- tests/components/portfolio.test.tsx`

Expected: PASS.

## Task 8: Build complete kill creation and editing

**Files:**
- Create: `components/kills/kill-form.tsx`
- Create: `components/kills/media-picker.tsx`
- Create: `components/kills/gpx-picker.tsx`
- Create: `components/kills/location-fields.tsx`
- Create: `components/kills/weapon-fields.tsx`
- Create: `components/kills/upload-list.tsx`
- Create: `app/portfolio/kills/new/page.tsx`
- Create: `app/portfolio/kills/[killId]/edit/page.tsx`
- Create: `tests/components/kill-form.test.tsx`

- [ ] **Step 1: Write form behavior tests**

Cover required factual fields, rifle/bow conditional fields, current-location
confirmation, photo/video validation, cover choice, raw GPX callback, edit
prefill, attachment preservation, upload progress/error, and successful save.

- [ ] **Step 2: Run tests red**

Run: `npm test -- tests/components/kill-form.test.tsx`

Expected: FAIL because record form components do not exist.

- [ ] **Step 3: Implement draft-first upload and form flow**

Generate the record ID before upload, persist `draft`, upload each file with
progress, store original GPX text, validate the final aggregate, then activate
the document. Edits merge through `applyKillEdit`; missing controls never clear
stored facts. Retain editor input on recoverable failures.

- [ ] **Step 4: Run form tests green**

Run: `npm test -- tests/components/kill-form.test.tsx`

Expected: PASS.

## Task 9: Build hunt detail, map, trash, restore, and profile settings

**Files:**
- Create: `components/map/route-map.tsx`
- Create: `components/kills/media-gallery.tsx`
- Create: `components/kills/hunt-facts.tsx`
- Create: `components/kills/trash-dialog.tsx`
- Create: `app/portfolio/kills/[killId]/page.tsx`
- Create: `app/portfolio/trash/page.tsx`
- Create: `app/portfolio/profile/page.tsx`
- Create: `tests/components/hunt-detail.test.tsx`

- [ ] **Step 1: Write detail and trash tests**

Test factual rendering, media gallery, route metrics, map fallback, explicit
trash confirmation, restore, and profile update/sign-out actions.

- [ ] **Step 2: Run tests red**

Run: `npm test -- tests/components/hunt-detail.test.tsx`

Expected: FAIL because detail components do not exist.

- [ ] **Step 3: Implement detail and lifecycle UI**

Dynamically import MapLibre client-side, use satellite raster tiles, draw the
parsed track and fit bounds, and preserve readable facts when mapping fails.
Trash updates only status/timestamps. Restore returns status to active.

- [ ] **Step 4: Run detail tests green**

Run: `npm test -- tests/components/hunt-detail.test.tsx`

Expected: PASS.

## Task 10: Verify, document, configure Firebase, and publish

**Files:**
- Modify: `README.md`
- Modify: `vault/0-Overview/System-Architecture.md`
- Modify: `vault/0-Overview/Data-Model.md`
- Modify: `vault/_index.md`
- Create: `vault/Frontend/Portfolio-v1.md`

- [ ] **Step 1: Run complete local verification**

Run: `npm run typecheck`

Run: `npm run lint`

Run: `npm test`

Run: `npm run test:rules`

Run: `npm run build`

Expected: every command exits 0.

- [ ] **Step 2: Run browser QA**

Start `npm run dev`, then verify welcome/auth, responsive portfolio, empty
state, record form, light/dark mode, route detail, trash/restore, keyboard
navigation, and console/network errors in the in-app browser.

- [ ] **Step 3: Configure production services**

Create or select the Firebase project, enable Google and email/password auth,
provision Firestore and Blaze-backed Storage, deploy indexes/rules, register the
web app, and set local/Vercel environment variables. Add localhost and the
Vercel domain to authorized domains.

- [ ] **Step 4: Update stable docs once**

Document the implemented architecture, authoritative data paths, security
boundaries, commands, environment setup, and invariant-preserving files.

- [ ] **Step 5: Commit, publish, and deploy**

Inspect scope, stage intended files, commit implementation separately from doc
updates, create a GitHub repository if no remote exists, push the branch, make
the repository shareable, deploy to Vercel, and record the source and live URLs.

- [ ] **Step 6: Repeat release verification**

Run all five gates from Step 1 against the final tree and smoke-test the live
URL before claiming completion.
