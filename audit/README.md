# Audit Loop — Codex ↔ Claude

Two-agent review loop. **Auditor = codex** (writes audits + re-reviews).
**Implementer = claude-code** (writes responses). The implementer never marks an
audit resolved — only the auditor signs off.

## Versioning
An audit is a **topic + major version** (v1, v2…). Iterations alternate authors:
- **Even decimals = auditor**, **odd decimals = implementer**.

Example flow for a topic:

    codex/audit-v1.md          ← initial audit        (auditor)
    claude-code/audit-v1.1.md  ← implementation reply  (implementer)
    codex/audit-v1.2.md        ← re-review            (auditor)
    claude-code/audit-v1.3.md  ← follow-up reply       (implementer)
    …                          ← until auditor signs off

Copy `_template.md` to start each new audit doc. These docs are working
artifacts — **never migrate them into the vault.**

## Each implementer response must document
- Findings addressed
- What was implemented
- What was **skipped and why**
- Files touched
- Verification checklist (typecheck / lint / build / tests)

## Live status tracker
_Update every pass._

| Topic | Version | Last author | Status |
|-------|---------|-------------|--------|
| _(none yet)_ | — | — | — |
