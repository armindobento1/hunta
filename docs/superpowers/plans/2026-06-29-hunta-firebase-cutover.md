# Hunta Firebase Cutover Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rename the product to Hunta and move the existing Vercel application to a fresh, private Firebase backend in the `onfoothunta` project.

**Architecture:** Keep the existing UID-rooted Auth, Firestore, and Storage adapters unchanged. Replace only customer-visible branding and environment/project configuration, provision the new backend in Johannesburg, deploy the already-tested ownership rules before cutover, and retain the old Firebase project as a rollback target.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS 4, Firebase Authentication, Cloud Firestore, Cloud Storage, Firebase CLI, Vercel CLI, Vitest, Firebase Emulator Suite, Chrome.

---

## File map

- `tests/app/page.test.tsx` — visible Hunta landing-brand contract.
- `tests/components/auth-card.test.tsx` — visible Hunta authentication-brand contract.
- `app/layout.tsx` — browser metadata.
- `app/page.tsx` — landing-page mark and accessible product name.
- `app/auth/page.tsx` — authentication-page accessible brand label.
- `components/auth/auth-card.tsx` — authentication branding and account prompts.
- `components/portfolio/empty-portfolio.tsx` — empty-state copy.
- `components/kills/kill-form.tsx` — create/edit/save record copy.
- `components/kills/kill-editor.tsx` — record-loading and save-error copy.
- `components/kills/trash-view.tsx` — recoverable-trash copy.
- `app/portfolio/kills/[killId]/page.tsx` — detail loading/error copy.
- `.firebaserc` — Firebase CLI target.
- `.env.local` — uncommitted local public Firebase Web configuration.
- Vercel environment settings — production/preview/development Firebase Web configuration.
- `README.md` — Hunta setup and operator instructions.
- `vault/Frontend/Portfolio-v1.md` — stable production backend and brand note.

The kill schema, GPX parser, repository path model, Firestore rules, and Storage
rules are not changed by this plan.

## Task 1: Establish an isolated, green baseline

**Files:**
- Inspect: repository worktree metadata
- Inspect: `package.json`

- [ ] **Step 1: Detect existing worktree isolation and branch state**

Run:

```bash
GIT_DIR=$(cd "$(git rev-parse --git-dir)" && pwd -P)
GIT_COMMON=$(cd "$(git rev-parse --git-common-dir)" && pwd -P)
BRANCH=$(git branch --show-current)
SUPERPROJECT=$(git rev-parse --show-superproject-working-tree 2>/dev/null || true)
printf '%s\n' "$GIT_DIR" "$GIT_COMMON" "$BRANCH" "$SUPERPROJECT"
```

Expected: branch `codex/firebase-hunting-portfolio-v1`; if this is not already a
linked worktree, obtain user consent before creating one or continue in place
only if the user declines.

- [ ] **Step 2: Install the locked dependencies**

Run:

```bash
npm install
```

Expected: exit 0 without changing dependency declarations.

- [ ] **Step 3: Verify the existing unit-test baseline**

Run:

```bash
npm test
```

Expected: all existing Vitest suites pass before product changes begin.

## Task 2: Rename customer-visible branding with TDD

**Files:**
- Modify: `tests/app/page.test.tsx`
- Modify: `tests/components/auth-card.test.tsx`
- Modify: `app/layout.tsx`
- Modify: `app/page.tsx`
- Modify: `app/auth/page.tsx`
- Modify: `components/auth/auth-card.tsx`
- Modify: `components/portfolio/empty-portfolio.tsx`
- Modify: `components/kills/kill-form.tsx`
- Modify: `components/kills/kill-editor.tsx`
- Modify: `components/kills/trash-view.tsx`
- Modify: `app/portfolio/kills/[killId]/page.tsx`

- [x] **Step 1: Add failing landing-brand assertions**

Add these assertions to the existing `HomePage` test after `render(<HomePage />)`:

```tsx
expect(screen.getByLabelText("Hunta")).toHaveTextContent("H");
expect(screen.queryByText("F")).not.toBeInTheDocument();
```

- [x] **Step 2: Add a failing authentication-brand assertion**

Add this assertion to the first `AuthCard` test after render:

```tsx
expect(screen.getByText("Hunta", { selector: ".eyebrow" })).toBeInTheDocument();
```

After the existing click on `Create account`, add:

```tsx
expect(screen.getByText("Already have an account?")).toBeInTheDocument();
```

- [x] **Step 3: Run the targeted tests and verify RED**

Run:

```bash
npx vitest run tests/app/page.test.tsx tests/components/auth-card.test.tsx
```

Expected: FAIL because the current UI exposes `Fieldnote` and the `F` mark.

- [x] **Step 4: Apply the minimal Hunta branding implementation**

Apply these exact customer-visible replacements:

```text
app/layout.tsx
  Fieldnote — Private hunting portfolio -> Hunta — Private hunting portfolio

app/page.tsx
  aria-label="Fieldnote" -> aria-label="Hunta"
  <span>F</span> -> <span>H</span>

app/auth/page.tsx
  aria-label="Fieldnote home" -> aria-label="Hunta home"

components/auth/auth-card.tsx
  <p className="eyebrow">Fieldnote</p> -> <p className="eyebrow">Hunta</p>
  New to Fieldnote? -> New to Hunta?

components/portfolio/empty-portfolio.tsx
  Your first Fieldnote starts here. -> Your first hunt record starts here.

app/portfolio/kills/[killId]/page.tsx
  fieldnote -> hunt record
  Fieldnote -> Hunt record

components/kills/kill-editor.tsx
  fieldnote -> hunt record
  Fieldnote -> Hunt record

components/kills/kill-form.tsx
  Edit fieldnote -> Edit hunt record
  New fieldnote -> New hunt record
  Save fieldnote -> Save hunt record

components/kills/trash-view.tsx
  restore a fieldnote -> restore a hunt record
```

Do not rename source files, route segments, domain types, Firebase collections,
or CSS classes.

- [x] **Step 5: Run targeted tests and verify GREEN**

Run:

```bash
npx vitest run tests/app/page.test.tsx tests/components/auth-card.test.tsx
```

Expected: both test files pass.

- [x] **Step 6: Verify no old customer-visible branding remains**

Run:

```bash
rg -n -S "Fieldnote|fieldnote" app components
```

Expected: no matches.

## Task 3: Register Hunta in `onfoothunta` and switch local configuration

**Files:**
- Modify: `.firebaserc`
- Modify: `.env.local` (uncommitted and secret-excluded)
- Inspect: `.env.example`

- [ ] **Step 1: Confirm Firebase CLI access to the target project**

Run:

```bash
firebase projects:list --json
firebase apps:list WEB --project onfoothunta --json
```

Expected: project `onfoothunta` is ACTIVE. Record whether a Web app already
exists so a duplicate is not created.

- [ ] **Step 2: Register exactly one Web app when none exists**

Run only when Step 1 returns no Web apps:

```bash
firebase apps:create WEB "Hunta Web" --project onfoothunta
```

Expected: one Web app with display name `Hunta Web` and an app ID beginning
with `1:105459367595:web:`.

- [ ] **Step 3: Retrieve the target Web app configuration**

Run with the app ID returned by Step 1 or Step 2:

```bash
firebase apps:sdkconfig WEB "$HUNTA_FIREBASE_APP_ID" --project onfoothunta --json
```

Expected: JSON configuration whose `projectId` is `onfoothunta`, whose
`authDomain` is `onfoothunta.firebaseapp.com`, and whose `storageBucket` is
rooted in `onfoothunta`.

- [ ] **Step 4: Point the Firebase CLI at the Hunta project**

Replace `.firebaserc` with this exact JSON:

```json
{
  "projects": {
    "default": "onfoothunta"
  }
}
```

- [ ] **Step 5: Replace local public Firebase values**

Map the SDK configuration into `.env.local` exactly as follows:

```dotenv
NEXT_PUBLIC_FIREBASE_API_KEY=<sdkConfig.apiKey>
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=<sdkConfig.authDomain>
NEXT_PUBLIC_FIREBASE_PROJECT_ID=<sdkConfig.projectId>
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=<sdkConfig.storageBucket>
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=<sdkConfig.messagingSenderId>
NEXT_PUBLIC_FIREBASE_APP_ID=<sdkConfig.appId>
NEXT_PUBLIC_USE_FIREBASE_EMULATORS=false
```

The angle-bracket expressions denote values read directly from the command in
Step 3; they are not literal values and must not be committed.

- [ ] **Step 6: Verify local configuration without printing values**

Run:

```bash
firebase use
node -e 'require("dotenv").config({path:".env.local"}); const required=["NEXT_PUBLIC_FIREBASE_API_KEY","NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN","NEXT_PUBLIC_FIREBASE_PROJECT_ID","NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET","NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID","NEXT_PUBLIC_FIREBASE_APP_ID"]; if(required.some((key)=>!process.env[key])) process.exit(1); if(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!=="onfoothunta") process.exit(2); console.log("Hunta Firebase config present")'
```

Expected: `onfoothunta` and `Hunta Firebase config present`.

## Task 4: Provision and secure the new Firebase backend

**Files:**
- Deploy unchanged: `firestore.rules`
- Deploy unchanged: `storage.rules`
- Deploy unchanged: `firestore.indexes.json`

- [ ] **Step 1: Create the default Firestore database in Johannesburg**

First inspect whether `(default)` exists. If it does not, run:

```bash
firebase firestore:databases:create "(default)" \
  --location africa-south1 \
  --edition standard \
  --delete-protection ENABLED \
  --project onfoothunta
```

Expected: the default Native-mode database is created in `africa-south1`
(Johannesburg). Its location is immutable.

- [ ] **Step 2: Enable Authentication providers in the Firebase console**

Open:

```text
https://console.firebase.google.com/project/onfoothunta/authentication/providers
```

Enable Email/Password with email-link sign-in disabled. Enable Google with
public-facing project name `Hunta` and the signed-in account's support email.
Do not enable anonymous authentication or additional providers.

- [ ] **Step 3: Add the required authorized domains**

In Authentication settings, ensure these exact domains are present:

```text
localhost
fieldnote-hunting-portfolio.vercel.app
```

Keep Firebase's generated domains. Do not authorize wildcard or unrelated
domains.

- [ ] **Step 4: Upgrade `onfoothunta` to Blaze**

Open the Usage and billing page for `onfoothunta`, select Blaze, and stop at any
payment-method form so the user can enter billing details privately. Continue
only after the console shows Blaze for `onfoothunta`.

- [ ] **Step 5: Create the default Storage bucket in Johannesburg**

In Firebase Storage, create the default `*.firebasestorage.app` bucket in
`africa-south1`. Do not select test-mode rules.

- [ ] **Step 6: Run the ownership-rule tests before production deployment**

Run:

```bash
JAVA_HOME=/opt/homebrew/opt/openjdk@21 \
PATH=/opt/homebrew/opt/openjdk@21/bin:$PATH \
npm run test:rules
```

Expected: all Firestore and Storage cross-user isolation tests pass.

- [ ] **Step 7: Deploy rules and indexes to `onfoothunta`**

Run:

```bash
firebase deploy --only firestore,storage --project onfoothunta
```

Expected: Firestore rules, Firestore indexes, and Storage rules deploy
successfully to `onfoothunta`.

## Task 5: Cut Vercel over and deploy Hunta

**Files:**
- Modify externally: Vercel project environment variables
- Deploy externally: existing Vercel production project

- [ ] **Step 1: Confirm the linked Vercel project and current environment names**

Run:

```bash
vercel project inspect
vercel env list
```

Expected: the linked project serves
`fieldnote-hunting-portfolio.vercel.app` and contains the six
`NEXT_PUBLIC_FIREBASE_*` variables.

- [ ] **Step 2: Update all Firebase variables in all Vercel environments**

For each of `production`, `preview`, and `development`, update these names with
the exact corresponding value from the Hunta SDK configuration retrieved in
Task 3:

```text
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID
```

Use this non-interactive form for each value and environment:

```bash
vercel env update "$VARIABLE_NAME" "$VERCEL_ENVIRONMENT" --value "$VARIABLE_VALUE" --yes
```

Expected: 18 updates succeed without printing credentials into repository
files. `NEXT_PUBLIC_USE_FIREBASE_EMULATORS` must be absent or `false` in
production.

- [ ] **Step 3: Run all local release gates before deployment**

Run:

```bash
npm run typecheck
npm run lint
npm test
JAVA_HOME=/opt/homebrew/opt/openjdk@21 PATH=/opt/homebrew/opt/openjdk@21/bin:$PATH npm run test:rules
npm run build
```

Expected: every command exits 0 with zero failed tests.

- [ ] **Step 4: Deploy the production build**

Run:

```bash
vercel deploy --prod --yes
```

Expected: deployment succeeds and the production alias remains
`https://fieldnote-hunting-portfolio.vercel.app`.

## Task 6: Verify the production cutover without fabricated hunt facts

**Files:**
- Inspect externally: deployed Hunta application
- Inspect externally: Firebase Authentication and Firestore consoles

- [ ] **Step 1: Verify branding and runtime health in Chrome**

Open:

```text
https://fieldnote-hunting-portfolio.vercel.app
```

Expected: browser title `Hunta — Private hunting portfolio`, visible `H` mark,
accessible label `Hunta`, no `Fieldnote` text, and no console errors caused by
Firebase initialization.

- [ ] **Step 2: Verify account creation with a non-personal smoke account**

Create an email/password account using a unique `@example.com` address and a
generated password. Confirm that authentication succeeds, the user reaches the
empty private portfolio, and a profile document is created under the matching
UID. Do not create a hunt record because fabricated kill facts violate the
authoritative-data invariant.

- [ ] **Step 3: Verify Google provider routing without selecting an account**

Click `Continue with Google` and confirm the popup identifies Hunta or routes
through `onfoothunta.firebaseapp.com`. Close the popup before choosing a Google
account; no personal Google data is transmitted during this check.

- [ ] **Step 4: Verify production ownership boundaries**

Confirm the deployed rules shown in Firebase match `firestore.rules` and
`storage.rules`. Treat the passing emulator cross-user tests from Task 4 as the
deterministic isolation proof; do not fabricate a second user's hunting data.

## Task 7: Update stable documentation and perform final verification

**Files:**
- Modify: `README.md`
- Modify: `vault/Frontend/Portfolio-v1.md`
- Modify: `docs/superpowers/plans/2026-06-29-hunta-firebase-cutover.md`

- [ ] **Step 1: Update README branding and backend instructions**

Replace the title and introductory product name with Hunta. In Firebase setup,
state that production uses project `onfoothunta`, Firestore and Storage use
`africa-south1`, and the Vercel domain must remain authorized for Firebase Auth.
Keep the existing privacy and service-account warnings.

- [ ] **Step 2: Patch the smallest affected vault note**

Append this production note to `vault/Frontend/Portfolio-v1.md`:

```markdown
## Production identity

The customer-facing product name is **Hunta**. Production uses Firebase project
`onfoothunta`; its Firestore database and default Storage bucket are provisioned
in `africa-south1` (Johannesburg). The previous Firebase project is retained
only as a rollback source and is not read by the application.
```

- [ ] **Step 3: Re-run the full release gates after documentation changes**

Run:

```bash
npm run typecheck
npm run lint
npm test
JAVA_HOME=/opt/homebrew/opt/openjdk@21 PATH=/opt/homebrew/opt/openjdk@21/bin:$PATH npm run test:rules
npm run build
git diff --check
```

Expected: all commands exit 0, all tests pass, and `git diff --check` reports no
whitespace errors.

- [ ] **Step 4: Inspect scope without committing or pushing**

Run:

```bash
git status --short
git diff -- app components tests README.md vault .firebaserc docs/superpowers
```

Expected: only the approved branding, Firebase target, design/plan, tests, and
documentation changes are present. Do not stage, commit, or push because the
repository instructions require a separate explicit user request.
