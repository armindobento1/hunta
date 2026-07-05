# Armory Loadouts and Farm Search Design

**Date:** 2026-06-30  
**Status:** Approved visual direction; awaiting written-spec review

## Goal

Replace the hunt-derived armory with a standalone private equipment library and
Call-of-Duty-style loadout builder. A saved loadout can prefill equipment on a
hunt without making historical hunt facts depend on future armory edits.

Replace mandatory manual coordinates with farm/place search on a map. Selecting
a search result saves its coordinates automatically. Pin movement and direct
coordinate entry remain optional precision tools.

## Scope

### Included

- Private armory items owned by the authenticated UID.
- Reusable named loadouts built weapon-first with attachment slots.
- Initial slots: optic, suppressor, bipod, sling, and ammunition.
- Create, edit, select, and explicitly delete armory items and loadouts.
- Loadout selection in new/edit hunt flows.
- An immutable equipment snapshot on each saved hunt.
- Farm/reserve autocomplete and search-result selection.
- A map preview with optional draggable-pin/manual-coordinate refinement.
- Backward compatibility for existing kills.
- Firestore ownership rules and emulator tests for new collections.

### Excluded

- Public loadouts, sharing, friends, or community equipment catalogs.
- Automatic armory creation from old hunts.
- Vendor/product databases or inferred attachment specifications.
- Images for equipment items in the first version.
- Offline geocoding.

## Data Model

All source records stay below the authenticated owner:

```text
users/{uid}/armoryItems/{itemId}
users/{uid}/loadouts/{loadoutId}
users/{uid}/kills/{killId}
```

### ArmoryItem

`ArmoryItem` is a discriminated union with shared fields:

- `id`, `ownerId`, `kind`, `name`, `manufacturer?`, `model?`
- `createdAt`, `updatedAt`

Kinds and factual details:

- `weapon`: weapon type (`rifle` or `bow`), model, caliber or bow type.
- `optic`: model and optional magnification/detail.
- `suppressor`: model and optional detail.
- `bipod`: model and optional detail.
- `sling`: model and optional detail.
- `ammunition`: grain plus optional brand/detail.

No default or example items are inserted. Every item is user-created.

### Loadout

- `id`, `ownerId`, `name`
- required `weaponId`
- optional typed slot IDs: `opticId`, `suppressorId`, `bipodId`, `slingId`,
  `ammunitionId`
- `isDefault`
- `createdAt`, `updatedAt`

The builder validates that each referenced item belongs to the same user and
matches the slot kind. A user can have at most one default loadout; setting a
new default clears the previous default in one Firestore batch.

### Kill equipment snapshot

Existing `weapon` and `ammunition` fields remain authoritative and required for
legacy compatibility. Add optional fields:

- `loadoutId`: the source loadout selected at entry time.
- `equipmentAttachments`: copied optic, suppressor, bipod, and sling facts.

Selecting a loadout copies its resolved item facts into the hunt form and the
saved Kill. The Kill never dereferences the live loadout for display. Editing or
deleting a loadout therefore cannot mutate an existing hunt. If the user edits
prefilled values before saving, the Kill stores those edited facts while keeping
`loadoutId` as provenance.

### Location source

Keep `latitude`, `longitude`, `placeName`, and optional `farmName`. Add optional
search provenance:

- `provider`: `esri`
- `featureId`: provider result identifier
- `label`: selected result label

Legacy locations without provenance remain valid.

## Firestore and State Flow

The private portfolio provider adds one subscription for armory items and one
for loadouts, mounted across private-route navigation. New repositories parse
all reads/writes through Zod schemas before state enters the UI.

Firestore rules allow reads and writes only when the path UID equals the
authenticated UID and `ownerId` cannot be changed. Deletes are explicit and
confirmed. Deleting an armory item that is referenced by a loadout is blocked
until the loadout is edited or deleted. Deleting a loadout never alters kills.

## Armory Experience

The Armory tab becomes a real source-management screen rather than a projection
from kills.

1. Empty state offers `Add weapon` and `Create loadout`.
2. Creating a loadout requires choosing or creating a weapon first.
3. The selected weapon appears as the hero item.
4. Attachment slots appear below it: optic, suppressor, bipod, sling, ammo.
5. Selecting a slot opens a sheet of compatible saved items plus `Add new`.
6. Save validates the weapon and all selected item kinds.
7. Saved loadouts appear as dark cards and can be edited, set default, or
   explicitly deleted.

## Hunt Equipment Flow

The equipment section starts with a loadout chooser:

- Default loadout is highlighted but not silently selected.
- Selecting a loadout fills weapon, ammunition, and attachment fields.
- `Browse loadouts` changes the selected setup.
- `Enter manually` preserves the existing direct-entry flow.
- Prefilled fields stay editable; edits affect only this hunt snapshot.
- A missing/deleted loadout does not prevent viewing or editing an existing
  hunt because all display facts live on the Kill.

## Farm Search and Map Flow

Use the Esri World Geocoding service with the existing Esri satellite tiles and
MapLibre renderer. The endpoint supports place-name and POI candidates without
introducing another client secret.

1. The primary control is `Search farm or reserve`.
2. Input is debounced and queries Esri `findAddressCandidates` place/POI search.
3. Existing country input biases or filters results when available.
4. Suggestions show the result name and regional/country context.
5. Selecting a result fills `farmName`, `placeName`, `country`, latitude,
   longitude, and search provenance.
6. The map centers on the result and displays a pin.
7. `Refine location` reveals a draggable pin and manual coordinate fields.
8. Moving the pin updates coordinates but never invents a farm/place label.

`VITE_GEOCODING_URL` can override the default Esri World Geocoding endpoint.
Search errors show a retry state and a manual farm/place fallback; they do not
erase a previously selected location.

## Error Handling

- Repository/schema failures surface actionable messages without dropping
  existing form state.
- A loadout with a missing item is marked incomplete and cannot be selected
  until repaired.
- Search requests are cancelled or ignored when superseded by newer input.
- Zero search results offer manual entry.
- Map rendering failure leaves the selected text and coordinates intact.
- Deletes require confirmation and never cascade to Kill records.

## Invariant Impact

1. **Kill-record integrity:** `lib/domain/kill.ts`, `kill-edit.ts`, and
   `kill-repository.ts` store equipment snapshots and preserve old records.
2. **Factual data:** loadout selection copies user-entered equipment facts;
   Esri supplies source coordinates; manual refinement is explicit.
3. **Media preservation:** unchanged.
4. **Multi-user isolation:** new armory/loadout paths and rules remain rooted at
   `users/{uid}`; no public projection is introduced.

## Testing

- Domain tests for item/loadout validation and Kill backward compatibility.
- Repository tests for parsing, typed slot resolution, default transactions,
  reference-safe deletion, and ownership.
- Form tests for loadout prefilling, manual overrides, and immutable snapshots.
- Search tests for debounce, stale-result rejection, selection, fallback, and
  optional refinement.
- Firestore emulator tests covering cross-user reads/writes and owner mutation.
- UI tests for empty armory, slot builder, incomplete loadouts, and delete
  confirmation.
- Full release gates: typecheck, lint, unit tests, rule tests, and build.

## Implementation Sequence

1. Armory/loadout schemas, repositories, rules, provider state, and tests.
2. Armory library and weapon-first slot builder.
3. Kill snapshot schema and loadout selection/prefill.
4. Esri search client and location-search UI.
5. Vault updates, full verification, browser QA, and production deployment.
