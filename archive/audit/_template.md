# Audit: <topic> — v<major>.<iteration>

- **Author:** <codex | claude-code>
- **Role:** <auditor | implementer>
- **Date:** <YYYY-MM-DD>
- **Status:** <open | in-progress | signed-off>

## Scope
<what this audit covers; the files/subsystems in question>

---

## Auditor sections (codex)

### Findings
1. **<title>** — <severity> — <description, file:line>

### Re-review (later iterations)
<what was verified resolved; what remains>

### Sign-off
<only the auditor writes this>

---

## Implementer sections (claude-code)

### Findings addressed
- <finding> → <what was done>

### Implemented
<summary of changes>

### Skipped (and why)
- <finding> → <reason>

### Files touched
- `path` — <change>

### Verification
- [ ] `npm run typecheck`
- [ ] `npm run lint`
- [ ] `npm run build`
- [ ] tests
