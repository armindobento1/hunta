---
name: save
description: Save and ship the current Hunta changes all the way through the chain — run the verification gates, do the batched vault docs pass, commit on a feature branch, merge to main, push (which triggers the Vercel deploy), and confirm the session state is durable so the chat can be cleared. Trigger with /save, optionally followed by a short description of the change (used for the branch name and commit message).
---

# /save — ship the working tree through the whole chain

Run every step below **in order**. Stop at the first failure, report it honestly,
and never continue to a later step past a failed gate. `$ARGUMENTS` (if given) is
a short description of the change — use it for the branch slug and commit subject.

## 0. Preflight

- `git status --short`. If the tree is clean, say so and stop — nothing to save.
- Review the diff (`git diff` + untracked files) so the commit message describes
  what actually changed, not what the conversation assumed.
- If any change touches a high-risk area from CLAUDE.md (kill data model,
  `lib/gpx/`, media/storage, feed ordering, auth or rules), confirm the matching
  playbook checks were done; if `firestore.rules`, `storage.rules`, or
  `lib/firebase/` changed, a security review is expected before shipping.

## 1. Verification gates (all must pass)

```
npm run typecheck
npm run lint
npm run test
npm run build
npm run test:rules   # ONLY if firestore.rules / storage.rules / lib/firebase changed
                     # (needs Firebase emulator + JDK 21 on PATH — see memory note)
```

Any failure → stop, report which gate failed with its output, do not commit.

## 2. Batched vault docs pass (one pass, smallest patch)

- If the change altered behavior, data shape, or a decision documented in
  `vault/`, patch the **smallest affected note** (update over create; enter via
  `vault/_index.md`). Skip entirely if no doc claim changed — don't invent docs.
- Include the vault edit in the same commit as the code it documents.

## 3. Commit on a branch (never directly on main)

- Branch: `feat/<slug>` or `fix/<slug>` from `$ARGUMENTS` or the diff content.
- Stage the task's files explicitly (no blanket `git add -A` if unrelated files
  are dirty — leave those behind and mention them).
- Commit message: subject line describing the change, a body with the *why*
  behind any non-obvious decision, ending with the Claude Co-Authored-By line.
- Separate cleanup / feature / fix commits if the diff genuinely mixes them.

## 4. Merge to main and push (this is the deploy)

```
git checkout main
git merge --no-ff <branch> -m "Merge <branch>: <one-line summary>"
git push origin main <branch>
```

- Pushing `main` does **not** auto-deploy: the Vercel project `onfoothunta`
  (linked in `.vercel/project.json`) has no git integration — deploys are
  CLI-driven. After the push, deploy explicitly from a clean main checkout:

  ```
  vercel deploy --prod
  ```
- The GitHub Pages landing page does **not** deploy from main (it deploys from
  `codex/firebase-hunting-portfolio-v1` `/docs`) — only mention it if `docs/`
  changed, and flag that those changes need porting to that branch.
- The GitNexus PostToolUse hook re-analyzes after commit/merge automatically —
  no manual reindex needed.

## 5. Confirm the deploy

- `vercel ls onfoothunta` and confirm the new deployment is ● Ready; report its
  URL and state. If the CLI isn't authenticated, report the push landed but the
  deploy is still pending and needs `vercel deploy --prod` — that IS a blocker
  for calling the chain complete.

## 6. Make the session clearable

- Verify `git status` is clean and everything durable is in its home:
  completed work in the commit message, decisions + reasons in the vault note,
  behavior locked in by tests. Write a `HANDOFF.md` **only** if work is left
  mid-flight or unverified — a handoff for finished work is noise.
- Finish with a short report: gates run and their results, commit/merge hashes,
  what was pushed, deploy status, and an explicit "safe to clear this chat"
  (or what still blocks it).
