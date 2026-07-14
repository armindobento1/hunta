# AGENTS.md — Hunta

**Read `CLAUDE.md` in this directory — it is the single canonical instruction
file for all agents working in this repo** (project overview, stack, invariants,
workflow, verification gates, git discipline). Do not duplicate its content
here; if instructions need to change, change them in `CLAUDE.md`.

Codex-specific notes:
- **Codex is the implementer.** Fable (Claude) architects and hands you a
  self-contained plan; you implement it with the smallest coherent change,
  staying within the plan's stated scope. Don't redesign or touch files the
  plan marks off-limits — flag concerns back instead. Fable reviews your diff
  and owns the final "done".
- **Respect the invariants and high-risk areas in `CLAUDE.md`.** Do not change
  `firestore.rules`, `storage.rules`, `lib/domain/`, or persistence beyond what
  the plan specifies; these guard multi-user isolation and kill-record
  integrity.
- The verification gates in `CLAUDE.md` apply to you identically: typecheck,
  lint, test, build (and `test:rules` when security rules or `lib/firebase/`
  change).
- The old folder audit loop is retired (archived under `archive/audit/`); we
  now collaborate live via the `codex` MCP tool.
