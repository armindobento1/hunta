# Hunta Playbook — read the matching section BEFORE editing that area

The thinking a senior engineer would do before touching each risk area, done
once and written down. Each section: blast radius → traps (real, found in this
code) → tests that must exist/pass → don'ts. Keep it current: when a new trap
bites, add a line the same day.

---

## 1. Kill model & edits (`lib/domain/kill.ts`, `kill-edit.ts`) — Invariant 1

**Blast radius.** The Zod schemas here validate every read AND write:
`lib/firebase/kill-repository.ts` + `serialization.ts` (persistence),
`components/kills/kill-form.tsx` / `kill-editor.tsx` (input), all selectors
and pages that render kills, and the public-social projection.

**Traps.**
- `applyKillEdit` only applies keys listed in the `editableKeys` allowlist.
  **Adding a field to the schema but not to `KillEdit` + `editableKeys` means
  edits to it are silently dropped** — no error, data just doesn't save. Any
  new kill field touches: schema → `KillEdit` type → `editableKeys` →
  serialization → form → a test proving the edit round-trips.
- Edit semantics: `undefined` = "no change", `null` = "clear" (e.g. `route`,
  `coverMediaId`, `trashedAt`). Never collapse the two.
- Every schema is `.strict()` — an unknown field in a persisted doc makes
  deserialization throw. Removing/renaming a field is a **migration**, not an
  edit: old documents in Firestore still carry the old shape.
- `coverMediaId` must reference an id in `media[]`; media is capped at 30.
- `date` is `YYYY-MM-DD`, `killTime` is `HH:mm` — plain strings, no timezone.
  They mean local wall-clock time at the hunt. Never route them through
  `Date`/`toISOString()` on edit — that shifts them by the device timezone.

**Tests.** `tests/domain/kill.test.ts` + `kill-edit.test.ts` must cover any
schema change; every new editable field gets an applyKillEdit case (set,
clear, unchanged). Serialization round-trip: `deserializeKill(serializeKill(k))`
must equal `k` for the new shape.

**Don'ts.** No schema field without updating serialization + tests. No
loosening `.strict()` to "make it work". No default values that fabricate
facts (a missing `killTime` is missing, not `"00:00"`).

## 2. GPX & derived facts (`lib/gpx/`) — Invariant 2

**Blast radius.** `parse-gpx.ts` + `haversine.ts` → `routeMetadataSchema`
(`distanceKm`, `durationMin`, `bounds`, `sourceHash`) → gpx-picker → map view.

**Traps.**
- The raw GPX in Storage is the source of truth; `distanceKm`/`durationMin`
  are derived. If derivation logic changes, stored values silently disagree
  with what a re-parse would produce — `sourceHash` exists to detect this.
  Change the parser → decide explicitly what happens to existing records.
- `durationMin` is nullable (GPX without timestamps); `distanceKm` is not.
  Don't invent a duration when timestamps are absent.
- `bounds` has a south≤north refinement; tracks crossing the antimeridian
  will produce nonsense west/east — flag, don't "fix" silently.

**Tests.** `tests/gpx/parse-gpx.test.ts`: malformed XML, empty track, single
point, missing timestamps, and a known-distance fixture asserting the derived
number. Never adjust an expected distance to make a test pass — that's
fabricating a fact.

**Don'ts.** Never write derived values without deriving them from the source.
Never mutate or re-encode the stored original GPX.

## 3. Media & trash (`components/kills/media-*`, `trash-*`, `lib/firebase/storage-repository.ts`) — Invariant 3

**Blast radius.** Upload flow (media-picker → upload-list → storage), cover
selection, the trash pages (`trash-view`, `trash-dialog`, `trash-page`).

**Traps.**
- Deletion is **trash-first**: `status`/`trashedAt` soft-delete, then explicit
  confirmed destruction. Never add a code path that deletes a Storage object
  or media entry directly because it's "cleanup".
- Removing a media entry from `media[]` without handling its Storage object
  orphans the file; deleting the Storage object while the entry exists breaks
  the record. Order matters — record first, storage cleanup only on the
  explicit confirmed path.
- If the removed media was the cover, `coverMediaId` must be reassigned or
  nulled in the same edit.
- **Photos are downscaled on upload** (`lib/firebase/optimize-image.ts`, wired
  into `uploadMedia`/`uploadAvatar`): re-encoded to WebP, max 2560px (768px for
  avatars). The stored WebP is the **single** media file — the camera original
  is intentionally not retained (approved product decision; see
  [[Performance-Local-First]]). Invariant 3 still holds for *stored* media
  (never destroyed once uploaded); it does not require keeping the pre-upload
  original. The util fails safe: any decode/encode failure, or a non-raster/GIF/
  SVG type, uploads the original file unchanged. Videos and GPX are never
  re-encoded.

**Tests.** Trash flow round-trip (trash → restore → nothing lost); cover
reassignment on media removal.

## 4. Auth boundary & rules (`firestore.rules`, `storage.rules`, `lib/firebase/`) — Invariant 4

**Blast radius.** Everything. Also: `public-social.ts` +
`public-social-repository.ts` + `follow-repository.ts` + leaderboard — the
social surface reads **projections**, never private source records.

**Traps.**
- The projection is an allowlist. When adding a field to Kill, the default is
  it stays private — adding it to the public projection is a deliberate,
  named decision. **Exact `location` (lat/lng) is sensitive** (reveals farms
  and hunting spots); it must never leak into any public/social/leaderboard
  shape.
- `isPublic` gates the projection, not the source record. Flipping visibility
  must update/remove the projection, or stale public data outlives the toggle.
- Any rules edit: run `npm run test:rules` (needs the Firebase emulator) and
  add a test for the new path — both the allowed case AND the denied
  cross-user case. A rules change without a new denial test is untested.

**Don'ts.** Never spread (`...kill`) into a public shape — list fields
explicitly. Never relax a rule to fix a client bug.

## 5. Feed ordering & grouping (`lib/domain/selectors.ts`)

**Blast radius.** `sortActiveKills`, `groupKillsByLocation`,
`getPortfolioStats` → home feed, portfolio page, stats. Ordering bugs are
silent — everything renders, just wrong.

**Traps.**
- Sorting relies on `date` (`YYYY-MM-DD`) + `killTime` (`HH:mm`) comparing
  correctly **as strings**. Anything that changes those formats breaks
  ordering with zero errors.
- Two kills, same date+time: the tiebreak must be deterministic, or the feed
  reshuffles between renders.
- "Active" filtering (trash status) happens in the selector — a new status
  value must be classified here or trashed items reappear in the feed.

**Tests.** `tests/domain/selectors.test.ts`: same-day ordering, tiebreak
stability, trashed exclusion, empty portfolio.

---

**Escalation.** If a change wants to weaken any section's "don't", that's an
architecture decision — stop, package the reasoning, and take it to the user
(or the strongest model available). Don't decide it inline.
