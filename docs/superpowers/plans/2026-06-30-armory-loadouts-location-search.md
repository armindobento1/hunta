# Armory Loadouts and Location Search Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build standalone private armory loadouts that prefill immutable hunt equipment snapshots, plus farm/POI search with optional coordinate refinement, then deploy to Vercel.

**Architecture:** Add UID-scoped armory item and loadout documents with Zod validation and realtime provider state. Resolve a selected loadout into the existing Kill weapon/ammunition fields plus optional attachment snapshots. Keep geocoding behind a focused Esri client and let the form own search/refinement state.

**Tech Stack:** React 19, TypeScript, Zod, Firebase Auth/Firestore, MapLibre GL JS, Esri World Geocoding REST API, Vitest, Testing Library, Firebase rules emulator, Vercel.

---

### Task 1: Armory domain and persistence

**Files:**
- Create: `lib/domain/armory.ts`
- Create: `lib/firebase/armory-repository.ts`
- Modify: `firestore.rules`
- Test: `tests/domain/armory.test.ts`
- Test: `tests/rules/firestore.rules.test.ts`

- [ ] Write failing tests that reject cross-kind loadout slots, accept a weapon-first loadout, and reject cross-user Firestore reads/writes.
- [ ] Run `npm test -- tests/domain/armory.test.ts` and confirm the missing module failure.
- [ ] Implement discriminated `ArmoryItem` schemas, `Loadout`, typed slot validation, CRUD subscriptions, default-loadout batch updates, and reference-safe item deletion.
- [ ] Add rules for `users/{uid}/armoryItems/{itemId}` and `users/{uid}/loadouts/{loadoutId}` using the same owner/path checks as kills.
- [ ] Run domain and emulator tests and confirm they pass.

### Task 2: Shared armory provider and Call-of-Duty builder

**Files:**
- Modify: `src/providers/portfolio-data-provider.tsx`
- Modify: `components/portfolio/armory-view.tsx`
- Modify: `components/portfolio/portfolio-dashboard.tsx`
- Modify: `src/styles/design-v2.css`
- Test: `tests/components/portfolio.test.tsx`

- [ ] Write failing UI tests for a true empty armory, creating a weapon, selecting attachment slots, and saving a named loadout.
- [ ] Run the focused test and confirm failure against the hunt-derived armory.
- [ ] Add armory/loadout subscriptions to the existing UID-scoped provider and expose focused hooks.
- [ ] Replace the derived armory with item management, weapon-first slot builder, compatible-item sheets, saved cards, default action, and confirmed deletes.
- [ ] Run the focused UI tests and confirm they pass.

### Task 3: Kill snapshots and loadout prefill

**Files:**
- Modify: `lib/domain/kill.ts`
- Modify: `lib/domain/kill-edit.ts`
- Modify: `components/kills/types.ts`
- Modify: `components/kills/kill-form.tsx`
- Modify: `components/kills/weapon-fields.tsx`
- Modify: `components/kills/kill-editor.tsx`
- Test: `tests/domain/kill.test.ts`
- Test: `tests/components/kill-form.test.tsx`

- [ ] Write failing tests proving old kills remain readable, loadout selection fills equipment, manual edits remain local, and saved snapshots survive loadout changes.
- [ ] Run the tests and confirm the new expectations fail.
- [ ] Add optional `loadoutId` and typed attachment snapshots while keeping existing weapon/ammunition required.
- [ ] Add a loadout chooser above manual equipment fields and resolve selections from provider state into form values.
- [ ] Save resolved/edited equipment facts on Kill without dereferencing the loadout during display.
- [ ] Run the focused tests and confirm they pass.

### Task 4: Farm search and optional precision

**Files:**
- Create: `lib/location/search-locations.ts`
- Create: `components/map/location-picker-map.tsx`
- Modify: `components/kills/location-fields.tsx`
- Modify: `components/kills/kill-form.tsx`
- Modify: `components/kills/types.ts`
- Modify: `lib/domain/kill.ts`
- Test: `tests/location/search-locations.test.ts`
- Test: `tests/components/kill-form.test.tsx`

- [ ] Write failing tests for Esri response parsing, abortable requests, selection-driven coordinates, and hidden optional precision controls.
- [ ] Run focused tests and confirm failure.
- [ ] Implement a provider-isolated Esri `findAddressCandidates` client returning label, region, country, feature ID, and WGS84 coordinates.
- [ ] Replace the required coordinate UI with debounced farm search, suggestion selection, map pin preview, and a `Refine location` disclosure containing draggable pin/manual coordinates.
- [ ] Preserve selected values when search/map errors and retain manual fallback.
- [ ] Run focused tests and confirm they pass.

### Task 5: Verification, documentation, and deployment

**Files:**
- Modify: `vault/0-Overview/Data-Model.md`
- Modify: `vault/Frontend/Portfolio-v1.md`
- Modify: `.env.example`

- [ ] Update the vault with standalone armory paths, Kill snapshot semantics, and Esri search provenance.
- [ ] Run `npm run typecheck`, `npm run lint`, `npm test`, Java-21 `npm run test:rules`, and `npm run build`.
- [ ] Run mobile browser QA for armory creation, loadout selection, farm search, and precision disclosure; fix any console/layout issues and repeat the gates after edits.
- [ ] Run `vercel deploy --prod --yes`, wait for `Ready`, and verify `https://onfoothunta.vercel.app` loads the new build.
