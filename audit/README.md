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
| Full Hunta codebase | v1.2 | claude-code (implementer) | Open — flag containment, F-02, F-15, and F-01 location redaction (text-only public location, farms retired) done; awaiting Codex re-review. Parity inverted for this topic: v1.1 was the auditor. |
| Buttons & interactions | v2 | codex (auditor) | Open — initial audit complete with 8 findings (F2-01–F2-08); awaiting Claude Code v2.1 implementation response. Production/local checks completed; authenticated two-account mutation proof remains required. |
