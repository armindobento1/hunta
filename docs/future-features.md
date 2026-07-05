# Future Features — Hunta

Planned features not yet built. Captured 2026-06-30. These extend the existing
**Kill** entity and **Profile** (see `vault/0-Overview/Data-Model.md`). Nothing
here is implemented yet — this is a spec/intent document for design + later build.

> **Mandatory-field policy (interim):** For now, the **only** new mandatory field
> is the **farm name** on a kill's location. Every other new field below is
> **optional** to save a record. Final mandatory-field decisions are deferred —
> owner to confirm with business partner before locking them in.

---

## 1. Species Leaderboards

A competitive ranking layer across users, **one leaderboard per species**.

- Each species (Kudu, Impala, etc.) has its own leaderboard.
- A kill ranks on its species' leaderboard based on the **measurement** the user
  inputs for the animal (see §3 — e.g. size/score, weight).
- Define the ranking metric per species up front (e.g. horn length / SCI-style
  score, body weight). Different species may rank on different metrics — decide
  the canonical metric per species.
- Entry onto a leaderboard requires the relevant measurement to be present;
  records without it simply don't rank (consistent with optional fields).
- **Privacy note (Invariant 4):** leaderboards are a *public/social projection*.
  They must expose only the deliberately-shared, ranked facts (species,
  measurement, user handle, maybe cover photo) — **never** direct access to a
  user's private source kill record.
- Open questions: global vs. per-country vs. per-friends-group leaderboards;
  anti-cheat / verification of measurements; tie-breaking; seasonal resets.

## 2. Armory / Loadout System ("Call of Duty loadout" feel)

A dedicated **Armory** section on the Profile where a user manages their gear,
then **selects a saved loadout** when logging a kill instead of re-typing
everything each time.

- Profile gains an editable **Armory**: a user's library of equipment —
  rifles, bows, sights/optics, ammunition, and any other gear.
- A **Loadout** = a named, saved combination of gear (e.g. weapon + caliber +
  ammo grain + optic). Think COD "create-a-class / select loadout".
- When uploading a kill, the user picks an existing loadout from the Armory and
  it pre-fills the kill's `weapon` / `ammunition` fields — no re-entry needed.
- Loadouts are reusable references; editing a loadout later must **not** mutate
  the gear already recorded on past kills (Invariant 1 — kill-record integrity).
  Treat the kill as storing a *snapshot/copy* of the loadout values at save time,
  not a live link.
- Suggested model additions:
  - `Profile.armory`: `{ weapons[], optics[], ammunition[], loadouts[] }`
  - `Loadout`: `{ id, name, weaponRef, opticRef, ammunitionRef, notes }`
  - Kill save: copies resolved values into existing `weapon` / `ammunition`.

## 3. Animal Measurements

New optional measurement fields on the **Kill** entity, feeding the leaderboards
(§1).

- `measurement.size` — animal size / trophy score (unit + metric TBD per species).
- `weight.dressed` — dressed (gutted/field-dressed) weight.
- `weight.undressed` — undressed (whole/live) weight.
- Units must be stored explicitly (kg vs lb) — never ambiguous.
- All optional; presence of the leaderboard-relevant metric is what enables
  ranking for that species.
- Invariant 2 still applies: these are real-world facts — derive nothing that
  overwrites a user-entered measurement.

## 4. Farm (Location) — name now mandatory

The kill's location gains a **farm name**, and it is the one **mandatory** new
field. Hunts occur on named farms/game ranches; the name drives planned
**business partnerships with farm owners**.

- `location.farmName` — **required** to save a kill (the sole interim mandatory
  field added by these features).
- Extends the existing `location` object (`{ lat, lng, placeName }`) — keep the
  map pin; add the farm name on top.
- Future commercial angle: link farms to farm-owner partners, directory,
  promotions. Design the farm as something that *could* become its own entity
  later (a `farmId` reference) even if v1 stores just the name string.

---

## Data-model deltas (summary, not yet applied)

| Entity | Add | Required? |
|--------|-----|-----------|
| Profile | `armory` (weapons, optics, ammunition, loadouts) | optional |
| Kill | `location.farmName` | **required** |
| Kill | `measurement.size` | optional |
| Kill | `weight.dressed`, `weight.undressed` (+ units) | optional |
| New | per-species `Leaderboard` projection | n/a (derived/public) |

When these are built, update `vault/0-Overview/Data-Model.md` and add per-feature
vault notes under `vault/Features/`.
