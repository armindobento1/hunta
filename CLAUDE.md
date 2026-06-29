# CLAUDE.md — Hunting Portfolio App

This file OVERRIDES default behavior. Read it, the vault `_index.md`, and the
audit `README.md` before doing any work.

## What this app is
A hunting **portfolio** — think *Instagram × Strava, for hunting*. A user keeps a
profile and a collection of **kill records** (the core entity). Each kill is one
card with the animal photo as its cover. Records are organized:

    Profile → Country → Year → Animal (kill card)

and viewable as:
- **Feed tab** — all kills in reverse-chronological order by kill date (Instagram-style).
- **Group-by-location tab** — same kills grouped by country / place.

Accounts are part of v1 through Firebase Authentication. Every portfolio is
private to its owner. Friend search and "see what your friends shot" come LATER;
future social views must never expose the private source records.

## The Core Principle
Cheapest sufficient source of truth, in order: **Memory → Docs → Code.**
Code is the final source of truth — never assume docs are correct without a
confidence check. If memory + docs answer with high confidence, act. If not,
inspect the *minimal* code needed and stop once you have enough.

## Stack (decided defaults — confirm before large changes)
- **Next.js (App Router) + TypeScript**, deployed on **Vercel**.
- **Tailwind CSS + shadcn/ui** for components (clean hand-off from Claude/Stitch design).
- **MapLibre GL JS** for the satellite walk view; **GPX parsing** for Garmin/Strava route import (store raw GPX verbatim + derive distance/time).
- **Data: Firebase Auth + Cloud Firestore + Cloud Storage.** Documents and files
  are rooted at the authenticated UID and guarded by deployed rules.
- **Capacitor-ready**: keep the UI a normal web app; avoid Node-only or
  server-only assumptions in client code so a Capacitor wrap stays cheap.

## Project structure
One line per top-level dir. Native/build dirs (`.next/`, future `ios/`, `android/`
from Capacitor) must NOT be hand-edited or moved.

| Dir | Owns |
|-----|------|
| `app/` | Next.js App Router routes (feed, country/year groupings, kill detail). |
| `components/` | Reusable UI (KillCard, MapView, MediaGallery, forms). |
| `lib/` | Domain logic: kill model, GPX parsing, distance/time derivation, grouping. |
| `data/` | Static onboarding copy only; never fabricated user records. |
| `public/` | Static media placeholders (real uploads move to Blob later). |
| `vault/` | Engineering docs (Layer 3). Not shipped. |
| `audit/` | Codex ↔ Claude audit loop (Layer 4). Working artifacts, never vault knowledge. |

## Domain model (the heart of the app)
Authoritative definition lives in `vault/0-Overview/Data-Model.md`. Summary —
a **Kill** record holds:
- `species`, `coverPhoto`, `media[]` (photos + videos)
- `country`, `date`, exact `killTime` (captured when location is set), `location` (lat/lng + place name) → `year` is derived from `date`
- `weapon`: `type` (`rifle` | `bow`), exact model; rifle → `caliber`; bow → bow type
- `ammunition`: grain + any brand/color detail
- `route`: raw imported GPX + derived `distanceKm` and `durationMin`, shown on satellite map
- `description`: free-text hunt narrative

## Critical invariants (non-negotiable — name the file that preserves each)
1. **Kill-record integrity.** A kill's core facts (species, date, `killTime`,
   `location`, `weapon`) must never be silently lost or mutated on edit, and
   media/route attachments must stay linked to the correct record.
   *Guarded by:* `lib/` kill model + persistence; every edit path.
2. **Factual data is authoritative, never fabricated.** `killTime`, `location`,
   caliber/grain, GPX track and its derived distance/time are real-world facts
   (relevant to tags/seasons/legality). Derive metrics from source; never invent
   or overwrite the source values.
   *Guarded by:* `lib/gpx`, location/time capture in the kill form.
3. **Media is never destroyed.** Uploaded photos/videos and original GPX are
   preserved; deletes are explicit and confirmed.
   *Guarded by:* media handling in `lib/` + `public/`/Blob layer.
4. **Multi-user isolation.** A user edits only their own private portfolio.
   Future friends' portfolios are read-only deliberate projections, never
   direct access to another user's private source records.
   *Guarded by:* `firestore.rules`, `storage.rules`, `lib/firebase/`, and rule tests.

## Mandatory execution workflow (every task)
Route → Check Memory → Check Docs (`vault/_index.md`) → Confidence check →
Minimal code inspection → Clarify if ambiguous → Risk check (see below) →
Execute → Vault update decision → Update docs (minimal patch) →
Store learnings (only if genuinely valuable).

## Risk areas (always impact-check before editing)
- Kill data model & persistence (`lib/domain/`, `lib/firebase/`) — touches every invariant.
- GPX parsing / distance-time derivation — Invariant 2.
- Media upload/storage — Invariant 3.
- Grouping & feed ordering logic — silent ordering bugs corrupt the portfolio view.
- Any future auth/account boundary — Invariant 4.

## Verification (must pass before anything is "done")
These are the release gates — run all, never claim done without them:
- `npm run typecheck`  (`tsc --noEmit`)
- `npm run lint`       (ESLint / `next lint`)
- `npm run build`      (`next build`)
- tests once they exist.
Until the app exists, "done" for a task = the scaffold/docs change is internally
consistent and the relevant vault note is updated.

## Commit discipline
Separate cleanup / feature / type-fix commits. Archive rather than delete. Never
auto-commit or push without being asked. Branch before committing on the default
branch. The repo is git-initialized; GitHub publish happens when you ask.

## Token-optimization rules
Never read the whole vault — start at `_index.md`. Don't read many files
unnecessarily; stop reading once you have enough. Batch tool calls. Prefer
scripts over repetitive manual edits. One vault update pass at the end of a task.

## Vault & audit rules (pointers)
- Vault: patch the smallest affected note; prefer updating over creating; never
  rewrite a whole folder; one batched pass per task. See `vault/_index.md`.
- Audit: topic + version; even decimals = auditor (codex), odd = implementer
  (claude-code); implementer never marks an audit resolved. See `audit/README.md`.
