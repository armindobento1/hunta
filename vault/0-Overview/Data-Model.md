# Data Model

The authoritative shape of the app's data. Read before editing `data/` or `lib/`.
Guards Invariants 1, 2, 4 in `CLAUDE.md`.

## Hierarchy
    Profile
      └─ Country (e.g. "South Africa")
           └─ Year (derived from kill date, not stored separately)
                └─ Kill (one card per animal shot)

Views over the same Kill set:
- **Feed**: all kills, reverse-chronological by `date` + `killTime`.
- **Group-by-location**: kills grouped by `country` (and place within).

## Entities

### Profile (one per authenticated user)
| Field | Notes |
|-------|-------|
| `id` | Firebase Authentication UID |
| `displayName` | |
| `avatar` | |
| `bio` | |

### Kill (core entity)
| Field | Type | Notes |
|-------|------|-------|
| `id` | string | stable, never reused |
| `species` | string | e.g. "Kudu", "Impala" |
| `coverPhoto` | media ref | the card cover |
| `media` | media[] | photos **and** videos of the hunt |
| `country` | string | grouping key |
| `date` | ISO date | `year` is derived from this |
| `killTime` | ISO time | captured when `location` is set — **factual, never fabricated** |
| `location` | { lat, lng, placeName } | map pin |
| `weapon` | object | see below |
| `ammunition` | object | see below |
| `route` | object \| null | imported GPX, see below |
| `description` | string | free-text hunt narrative |
| `createdAt` / `updatedAt` | ISO | audit fields |
| `ownerId` | string | authenticated UID; immutable |
| `status` | `draft` \| `active` \| `trashed` | trash is recoverable |
| `trashedAt` | ISO \| null | required only for trashed records |

### weapon
| Field | Notes |
|-------|-------|
| `type` | `"rifle"` \| `"bow"` |
| `model` | exact weapon/model used |
| `caliber` | rifle only |
| `bowType` | bow only (e.g. compound/recurve) |

### ammunition
| Field | Notes |
|-------|-------|
| `grain` | number — bullet/arrow weight |
| `brand` / `detail` | optional (covers brand/color notes) |

### route (Garmin / Strava import)
| Field | Notes |
|-------|-------|
| `rawGpx` | source GPX stored **verbatim** — Invariant 2 |
| `distanceKm` | derived from track, never overwrites source |
| `durationMin` | derived from track timestamps |
| `bounds` | for fitting the satellite map view |

## Rules
- `year` is always derived from `date` — do not persist a separate year that can
  drift out of sync.
- Derived route metrics (`distanceKm`, `durationMin`) are computed from `rawGpx`;
  if they disagree, `rawGpx` wins.
- Every Kill keeps its own media/route references; grouping/feed are views, not
  storage — re-grouping must never move or rewrite a Kill's data.
- Firestore source path is `users/{uid}/kills/{killId}`. `ownerId` must match
  the path UID and cannot change.
- Storage source paths are nested under the same UID and kill ID. Domain
  validation rejects attachment paths linked to another owner or record.
- Deletes are status transitions to recoverable trash. Source media and GPX are
  retained.
