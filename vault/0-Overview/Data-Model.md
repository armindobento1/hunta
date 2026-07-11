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
| `location` | { lat, lng, placeName, farmName?, source? } | map pin selected through place search; coordinates are captured from the selected result and may be manually refined; source preserves Esri result provenance |
| `weapon` | object | see below |
| `ammunition` | object | see below |
| `loadoutId` | string \| undefined | optional reference to the selected reusable armory setup |
| `equipmentAttachments` | object \| undefined | immutable-at-save snapshot of optic, suppressor, bipod, and sling used on this hunt |
| `measurement` | object \| undefined | optional factual trophy score/size and dressed/undressed weight |
| `route` | object \| null | imported GPX, see below |
| `description` | string | free-text hunt narrative |
| `createdAt` / `updatedAt` | ISO | audit fields |
| `ownerId` | string | authenticated UID; immutable |
| `status` | `draft` \| `active` \| `trashed` | trash is recoverable |
| `trashedAt` | ISO \| null | required only for trashed records |
| `isPublic` | boolean \| undefined | explicit publication choice; false/absent keeps the source private |

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

### measurement
| Field | Notes |
|-------|-------|
| `score` | optional positive number; never inferred. `in` scores stay decimal in storage (needed for leaderboard ranking); the form captures them with inches + eighths pickers and every view renders hunter notation ("26 5/8 in") via `lib/ui/format-score.ts` |
| `scoreUnit` / `scoringSystem` | optional factual context such as inches and SCI |
| `weightDressed` / `weightUndressed` | optional positive numbers |
| `weightUnit` | `kg` or `lb` |

### ArmoryItem and Loadout

- Equipment is stored independently at `users/{uid}/armoryItems/{itemId}` as a weapon, optic, suppressor, bipod, sling, arrow, broadhead, or ammunition item. Ammunition and broadheads carry a required `grain` fact.
- Reusable setups live at `users/{uid}/loadouts/{loadoutId}` and reference one weapon plus optional typed attachment slots.
- Slots are weapon-type-aware via the schematic definitions in `lib/domain/armory.ts` (`getLoadoutSchematic`): rifle → optic, suppressor, ammunition, bipod, sling; bow → sight (optic), arrow, broadhead, sling. Each schematic slot carries a percentage anchor for the loadout-builder illustration; `resolveLoadout` rejects slots outside the weapon's schematic.
- Selecting a loadout pre-fills a Kill, but the Kill persists factual snapshots; later armory edits never rewrite historical hunt facts.

### Engagement (likes, comments, notifications)

- Likes at `publicHunts/{huntId}/likes/{likerUid}` (doc id = liker → one like per user), comments at `publicHunts/{huntId}/comments/{commentId}`. Both publicly readable like the hunt itself; created only as yourself; comments moderated (deletable) by the hunt owner. Unpublishing clears both subcollections first.
- Comments support single-level replies (`parentId` → root comment; orphaned replies render as roots) and likes via a `likedBy` uid array — rules allow an update touching only `likedBy` that adds/removes exactly the caller's own uid; authors editing their comment cannot change its likes.
- Notifications at `users/{recipientUid}/notifications/{id}`, written by the *actor* in the same batch as the follow/like/comment. Rules verify the backing action exists via `existsAfter()` so activity cannot be fabricated. Deterministic ids (`follow_{actor}`, `like_{actor}_{hunt}`, `comment_{commentId}`) let unlike/unfollow retract exactly one notification. Recipient can only mark `readAt`; actor may retract their own.
- Follower/following counts use aggregation queries (`getCountFromServer`); lists resolve display names from `publicProfiles`. Account deletion also clears the `notifications` subcollection.
- "Following" is public: derived via a collection-group query over `publicFollowers/*/followers` where `followerId == uid` (rules expose read-only collection-group access to `followers`; `firestore.indexes.json` carries the COLLECTION_GROUP field override). The private `users/{uid}/following` copy remains owner-only.
- Domain in `lib/domain/engagement.ts`, persistence in `lib/firebase/engagement-repository.ts` + `follow-repository.ts`, hooks in `lib/hooks/use-{engagement,notifications,follow-stats}.ts`.

### Forum (community Q&A)

- `forumQuestions/{questionId}` with answers at `forumQuestions/{questionId}/answers/{answerId}` — the first shared writable collection (not a projection of private records).
- Readable by any signed-in user; every document is writable only by its author (`authorId` pinned to the caller in rules). Accepting an answer is a question update (`acceptedAnswerId`), so only the question author can do it.
- `authorName` is a denormalized snapshot taken at post time. `createdAt` is bounded to ≲ request time on create to prevent feed pinning; answers require an existing parent question.
- Domain logic in `lib/domain/forum.ts`, persistence in `lib/firebase/forum-repository.ts`, subscriptions in `lib/hooks/use-forum.ts`.

### Public social projections

- `publicProfiles/{uid}` is a searchable read-only projection of public account identity.
- `publicHunts/{uid}_{killId}` is created only when the owner selects Publish publicly. It includes the approved hunt facts, public media URLs, farm, and coordinates but excludes private storage paths and persistence metadata.
- `users/{followerUid}/following/{followedUid}` and its public follower mirror record owner-controlled follows.
- Unpublishing deletes only the public projection. The private Kill and all source media remain intact.

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
- Armory items and loadouts use the same UID-rooted ownership boundary.
- Storage source paths are nested under the same UID and kill ID. Domain
  validation rejects attachment paths linked to another owner or record.
- Deletes are status transitions to recoverable trash. Source media and GPX are
  retained.
