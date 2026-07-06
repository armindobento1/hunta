# Vault Index — Hunta

Entry point for all stable engineering knowledge. **Start here; never scan the
whole vault.** Patch the smallest affected note; prefer updating over creating.

## 0-Overview
- [[System-Architecture]] — stack, layers, how a kill flows from input to display.
- [[Data-Model]] — the **Kill** entity and the Profile → Country → Year → Animal hierarchy. **Read this before touching `data/` or `lib/`.**

## Playbooks
- [[Hunta-Playbook]] — **read the matching section before editing any risk
  area**: kill model/edits, GPX facts, media/trash, auth boundary, feed
  ordering — blast radius, traps, required tests per area.

## Frontend
- [[Portfolio-v1]] — implemented routes, components, state flow, and verification.

## Backend
- Firebase Auth + Firestore + Storage adapters under `lib/firebase/`; ownership
  rules at repository root.

## Features
- _(per-feature notes: route import, grouping, media upload — added as built)_

## Decisions
- [[Capacitor-Wrap]] — iOS/Android native shells, config-only native edits, Google sign-in gating, build requirements.

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
