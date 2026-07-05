# AGENTS.md — Hunta

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
- **Vite + React + TypeScript + React Router**, deployed on **Vercel** as a
  clean-URL single-page app.
- **Tailwind CSS + shadcn/ui** for components (clean hand-off from Codex/Stitch design).
- **MapLibre GL JS** for the satellite walk view; **GPX parsing** for Garmin/Strava route import (store raw GPX verbatim + derive distance/time).
- **Data: Firebase Auth + Cloud Firestore + Cloud Storage.** Documents and files
  are rooted at the authenticated UID and guarded by deployed rules.
- **Capacitor-ready**: keep the UI a normal web app; avoid Node-only or
  server-only assumptions in client code so a Capacitor wrap stays cheap.

## Project structure
One line per top-level dir. Native/build dirs (`dist/`, future `ios/`, `android/`
from Capacitor) must NOT be hand-edited or moved.

| Dir | Owns |
|-----|------|
| `src/` | Vite entry, clean route tree, route pages, providers, and global styles. |
| `components/` | Reusable UI (KillCard, MapView, MediaGallery, forms). |
| `lib/` | Domain logic: kill model, GPX parsing, distance/time derivation, grouping. |
| `archive/` | Non-shipped legacy shells retained for reference; never active source. |
| `data/` | Static onboarding copy only; never fabricated user records. |
| `public/` | Static media placeholders (real uploads move to Blob later). |
| `vault/` | Engineering docs (Layer 3). Not shipped. |
| `audit/` | Codex ↔ Codex audit loop (Layer 4). Working artifacts, never vault knowledge. |

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
- `npm run lint`       (ESLint)
- `npm run build`      (`tsc --noEmit && vite build`)
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
  (Codex); implementer never marks an audit resolved. See `audit/README.md`.

<!-- gitnexus:start -->
# GitNexus — Code Intelligence

This project is indexed by GitNexus as **Hunta** (520 symbols, 1300 relationships, 36 execution flows). Use the GitNexus MCP tools to understand code, assess impact, and navigate safely.

> If any GitNexus tool warns the index is stale, run `npx gitnexus analyze` in terminal first.

## Always Do

- **MUST run impact analysis before editing any symbol.** Before modifying a function, class, or method, run `gitnexus_impact({target: "symbolName", direction: "upstream"})` and report the blast radius (direct callers, affected processes, risk level) to the user.
- **MUST run `gitnexus_detect_changes()` before committing** to verify your changes only affect expected symbols and execution flows.
- **MUST warn the user** if impact analysis returns HIGH or CRITICAL risk before proceeding with edits.
- When exploring unfamiliar code, use `gitnexus_query({query: "concept"})` to find execution flows instead of grepping. It returns process-grouped results ranked by relevance.
- When you need full context on a specific symbol — callers, callees, which execution flows it participates in — use `gitnexus_context({name: "symbolName"})`.

## When Debugging

1. `gitnexus_query({query: "<error or symptom>"})` — find execution flows related to the issue
2. `gitnexus_context({name: "<suspect function>"})` — see all callers, callees, and process participation
3. `READ gitnexus://repo/Hunta/process/{processName}` — trace the full execution flow step by step
4. For regressions: `gitnexus_detect_changes({scope: "compare", base_ref: "main"})` — see what your branch changed

## When Refactoring

- **Renaming**: MUST use `gitnexus_rename({symbol_name: "old", new_name: "new", dry_run: true})` first. Review the preview — graph edits are safe, text_search edits need manual review. Then run with `dry_run: false`.
- **Extracting/Splitting**: MUST run `gitnexus_context({name: "target"})` to see all incoming/outgoing refs, then `gitnexus_impact({target: "target", direction: "upstream"})` to find all external callers before moving code.
- After any refactor: run `gitnexus_detect_changes({scope: "all"})` to verify only expected files changed.

## Never Do

- NEVER edit a function, class, or method without first running `gitnexus_impact` on it.
- NEVER ignore HIGH or CRITICAL risk warnings from impact analysis.
- NEVER rename symbols with find-and-replace — use `gitnexus_rename` which understands the call graph.
- NEVER commit changes without running `gitnexus_detect_changes()` to check affected scope.

## Tools Quick Reference

| Tool | When to use | Command |
|------|-------------|---------|
| `query` | Find code by concept | `gitnexus_query({query: "auth validation"})` |
| `context` | 360-degree view of one symbol | `gitnexus_context({name: "validateUser"})` |
| `impact` | Blast radius before editing | `gitnexus_impact({target: "X", direction: "upstream"})` |
| `detect_changes` | Pre-commit scope check | `gitnexus_detect_changes({scope: "staged"})` |
| `rename` | Safe multi-file rename | `gitnexus_rename({symbol_name: "old", new_name: "new", dry_run: true})` |
| `cypher` | Custom graph queries | `gitnexus_cypher({query: "MATCH ..."})` |

## Impact Risk Levels

| Depth | Meaning | Action |
|-------|---------|--------|
| d=1 | WILL BREAK — direct callers/importers | MUST update these |
| d=2 | LIKELY AFFECTED — indirect deps | Should test |
| d=3 | MAY NEED TESTING — transitive | Test if critical path |

## Resources

| Resource | Use for |
|----------|---------|
| `gitnexus://repo/Hunta/context` | Codebase overview, check index freshness |
| `gitnexus://repo/Hunta/clusters` | All functional areas |
| `gitnexus://repo/Hunta/processes` | All execution flows |
| `gitnexus://repo/Hunta/process/{name}` | Step-by-step execution trace |

## Self-Check Before Finishing

Before completing any code modification task, verify:
1. `gitnexus_impact` was run for all modified symbols
2. No HIGH/CRITICAL risk warnings were ignored
3. `gitnexus_detect_changes()` confirms changes match expected scope
4. All d=1 (WILL BREAK) dependents were updated

## Keeping the Index Fresh

After committing code changes, the GitNexus index becomes stale. Re-run analyze to update it:

```bash
npx gitnexus analyze
```

If the index previously included embeddings, preserve them by adding `--embeddings`:

```bash
npx gitnexus analyze --embeddings
```

To check whether embeddings exist, inspect `.gitnexus/meta.json` — the `stats.embeddings` field shows the count (0 means no embeddings). **Running analyze without `--embeddings` will delete any previously generated embeddings.**

> Claude Code users: A PostToolUse hook handles this automatically after `git commit` and `git merge`.

## CLI

| Task | Read this skill file |
|------|---------------------|
| Understand architecture / "How does X work?" | `.claude/skills/gitnexus/gitnexus-exploring/SKILL.md` |
| Blast radius / "What breaks if I change X?" | `.claude/skills/gitnexus/gitnexus-impact-analysis/SKILL.md` |
| Trace bugs / "Why is X failing?" | `.claude/skills/gitnexus/gitnexus-debugging/SKILL.md` |
| Rename / extract / split / refactor | `.claude/skills/gitnexus/gitnexus-refactoring/SKILL.md` |
| Tools, resources, schema reference | `.claude/skills/gitnexus/gitnexus-guide/SKILL.md` |
| Index, status, clean, wiki CLI commands | `.claude/skills/gitnexus/gitnexus-cli/SKILL.md` |

<!-- gitnexus:end -->
