# AGENTS.md — Hunta

**Read `CLAUDE.md` in this directory — it is the single canonical instruction
file for all agents working in this repo** (project overview, stack, invariants,
workflow, verification gates, git discipline). Do not duplicate its content
here; if instructions need to change, change them in `CLAUDE.md`.

Codex-specific notes:
- In the audit loop (`audit/README.md`), **Codex is the auditor**: even decimal
  versions are yours; odd decimals belong to the implementer (Claude Code).
  The implementer never marks an audit resolved — you do, after verifying.
- The verification gates in `CLAUDE.md` apply to you identically: typecheck,
  lint, test, build (and `test:rules` when security rules or `lib/firebase/`
  change).
