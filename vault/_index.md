# Vault Index — Hunta

Entry point for all stable engineering knowledge. **Start here; never scan the
whole vault.** Patch the smallest affected note; prefer updating over creating.

## 0-Overview
- [[System-Architecture]] — stack, layers, how a kill flows from input to display.
- [[Data-Model]] — the **Kill** entity and the Profile → Country → Year → Animal hierarchy. **Read this before touching `data/` or `lib/`.**

## Frontend
- [[Portfolio-v1]] — implemented routes, components, state flow, and verification.

## Backend
- Firebase Auth + Firestore + Storage adapters under `lib/firebase/`; ownership
  rules at repository root.

## Features
- _(per-feature notes: route import, grouping, media upload — added as built)_

## Decisions
- _(locked-in design choices + rationale)_

## Bugs
- _(past incidents + fixes)_

## Documentation map (note ↔ code)
| Note | Documents |
|------|-----------|
| System-Architecture | overall `src/` + `components/` + `lib/` flow |
| Data-Model | `data/` types, `lib/` kill model |
| Portfolio-v1 | `src/`, `components/`, `lib/firebase/`, rules, tests |

> Token sinks (never read for context): none yet. Session logs/backups, when
> added, will be marked here.
