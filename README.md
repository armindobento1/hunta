# Fieldnote — Hunting Portfolio

Fieldnote is a private, multi-user hunting portfolio: Instagram-style field
records with Strava-style GPX routes. Each account owns a collection of complete
kill records organized as Profile → Country → Year → Animal.

## Features

- Google and email/password accounts through Firebase Authentication.
- Private per-user Firestore records protected by tested security rules.
- Complete create/edit/detail workflow for species, date, exact kill time,
  location, weapon, ammunition, description, photos, videos, and GPX.
- Original GPX storage plus client-derived distance, duration, bounds, and a
  MapLibre satellite route.
- Reverse-chronological feed, list/grid card treatments, and country/place/year
  grouping.
- Recoverable trash: record facts and attachments are never silently deleted.
- Responsive Apple-inspired design based on the supplied design canvas.

## Stack

Next.js 16 · React 19 · TypeScript · Tailwind CSS 4 · Firebase Auth, Firestore,
and Storage · MapLibre GL JS · Vitest · Firebase Emulator Suite · Vercel.

## Local setup

Requirements: Node.js 24 and Java 21 (for Firebase emulator rule tests).

```bash
npm install
cp .env.example .env.local
npm run dev
```

Populate `.env.local` with the Firebase Web app values. Public Firebase Web
configuration is safe to expose; authorization is enforced by Firestore and
Storage rules. Never add service-account keys to client environment variables.

Open [http://localhost:3000](http://localhost:3000).

## Verification

```bash
npm run typecheck
npm run lint
npm test
npm run test:rules
npm run build
```

If Java 21 is installed through Homebrew but is not the shell default:

```bash
JAVA_HOME=/opt/homebrew/opt/openjdk@21 \
PATH=/opt/homebrew/opt/openjdk@21/bin:$PATH \
npm run test:rules
```

## Firebase setup

1. Create a Firebase Web app and copy its config into `.env.local` and Vercel.
2. Enable Google and email/password Authentication.
3. Create Firestore in Native mode.
4. Upgrade to Blaze, then create Cloud Storage. Firebase requires Blaze for new
   Storage buckets.
5. Deploy the rules and indexes:

```bash
firebase deploy --only firestore,storage
```

6. Add localhost and the deployed Vercel domain to Authentication's authorized
   domains.

## Repository map

- `app/` — routes for auth, portfolio, records, trash, and profile settings.
- `components/` — responsive UI, record workflow, and route map.
- `lib/domain/` — authoritative schemas, edit integrity, ordering, grouping.
- `lib/gpx/` — source-preserving GPX parsing and derivation.
- `lib/firebase/` — authenticated persistence and upload adapters.
- `tests/` — domain, component, and emulator security tests.
- `firestore.rules`, `storage.rules` — production ownership boundary.
- `vault/` — stable engineering knowledge; begin at `vault/_index.md`.
- `Hunting Portfolio App/` — original design-canvas source retained verbatim.

## Privacy model

All v1 portfolios are private. Firestore and Storage paths are rooted at the
authenticated UID. Public profiles, friends, and social discovery are not part
of this release.
