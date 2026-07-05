# Hunta Vite + React Migration Design

## Goal

Move Hunta from Next.js App Router to a Vite + React single-page application
without changing its customer-facing behavior, Firebase data model, ownership
rules, media paths, GPX derivation, or clean route URLs. The resulting web build
must deploy to Vercel as static assets and remain suitable for a later Capacitor
wrap. Capacitor and native platform folders are explicitly deferred.

## Chosen approach

Use a staged in-place migration. Add the Vite application shell and React
Router route tree while reusing the existing components, domain logic,
Firebase repositories, rules, and tests. Verify route and behavior parity
before archiving the old Next.js shell and removing Next-only dependencies.

This avoids a fresh rewrite and keeps the four portfolio invariants behind the
same domain, persistence, media, GPX, and security-rule code.

## Non-goals

- Do not add Capacitor, `ios/`, or `android/`.
- Do not redesign the Hunta UI.
- Do not change Firestore collections, Storage paths, schemas, or rules.
- Do not migrate or fabricate user records.
- Do not introduce a server API, SSR, or server-side authentication layer.
- Do not deploy, commit, or push without a separate explicit request.

## Application architecture

Vite owns development and production bundling. `index.html` supplies the Hunta
metadata and mounts React through `src/main.tsx`. `src/app.tsx` composes global
providers and the router. `src/router.tsx` defines the complete route tree.

The existing `components/` and `lib/` directories remain the primary UI and
domain/persistence layers. The migration replaces Next-specific imports with
React Router equivalents and moves route-page components into `src/pages/`.
The `@/` alias continues to resolve from the repository root so reusable code
does not need broad import rewrites.

Tailwind remains PostCSS-driven. The existing global stylesheet, including the
MapLibre stylesheet import, moves under the Vite entry path without changing
the rendered design.

## Route contract

Use `BrowserRouter` and preserve these clean URLs exactly:

- `/`
- `/auth`
- `/portfolio`
- `/portfolio/kills/new`
- `/portfolio/kills/:killId`
- `/portfolio/kills/:killId/edit`
- `/portfolio/profile`
- `/portfolio/trash`

Vercel receives a single-page-application fallback so direct requests and
browser refreshes on any application route serve `index.html`. Static assets
remain directly addressable. A not-found route renders an in-app recovery view
instead of silently redirecting.

Links use React Router `Link`; imperative transitions use `useNavigate`; kill
IDs come from `useParams`. Route guards use declarative navigation after auth
readiness resolves.

## Authentication and portfolio data

Firebase Authentication remains the identity source. The current
`AuthProvider` stays mounted at the application root.

Add an authenticated portfolio data provider above the private route tree. It
owns the live profile and kill subscriptions for the current UID and keeps them
mounted while users navigate among portfolio, profile, trash, create, edit, and
detail routes. Existing hooks read from this provider rather than creating a
new Firestore listener on every page mount.

This addresses the current full-page loading lag without changing source data:
the provider caches only the latest subscription snapshots in memory, clears
them on sign-out or UID change, and never writes derived or fabricated facts.
Profile creation retains the current first-login behavior.

## Firebase environment configuration

Vite exposes client variables through `import.meta.env`. Rename the public web
configuration keys from `NEXT_PUBLIC_FIREBASE_*` to `VITE_FIREBASE_*`, plus
`VITE_USE_FIREBASE_EMULATORS` and `VITE_SATELLITE_TILE_URL`.

Keep validation centralized in `lib/firebase/config.ts`. No secret or service
account value enters the browser bundle. Local `.env.local` remains ignored;
`.env.example`, README guidance, and Vercel environment names are updated as
part of the migration. Updating external Vercel values and deploying remain
separate user-authorized operations.

## Error and loading behavior

Authentication readiness retains an explicit loading state. Private routes
redirect unauthenticated users to `/auth`; authenticated users visiting
`/auth` redirect to `/portfolio`.

The persistent portfolio provider exposes independent auth, profile, and kill
loading/error states. Initial entry may show a centered loader, but navigation
between already-loaded private routes preserves data and avoids replacing the
entire interface with a fresh subscription spinner. Existing safe user-facing
Firebase error messages remain unchanged.

## Next.js archive and dependency cleanup

After Vite reaches parity, archive the previous Next route shell and config
under a non-shipped archive location in accordance with repository policy.
Remove `next` and `eslint-config-next`; add `vite`, `react-router-dom`, and the
appropriate React ESLint support. Production scripts become Vite commands and
the output directory becomes `dist/`.

The archive is excluded from TypeScript, ESLint, Vitest, and production builds.
Native/build directories remain untouched.

## Test strategy

Use test-first migration contracts:

1. Route tests prove every clean URL renders the expected page and private
   routes enforce authentication.
2. Dynamic route tests prove `:killId` reaches detail and edit pages.
3. Navigation tests prove Hunta links use the preserved paths.
4. Provider tests prove profile/kill subscriptions survive private route
   navigation and reset on UID change or sign-out.
5. Existing component, domain, Firebase adapter, GPX, and rule suites remain
   green.
6. The Vite production build must emit `dist/index.html` and static assets.
7. Browser smoke tests cover landing, auth, private redirect, clean-URL direct
   loads, refresh behavior, title/branding, and console errors.

Release gates remain:

- `npm run typecheck`
- `npm run lint`
- `npm test`
- `npm run test:rules` with Java 21
- `npm run build`
- `git diff --check`

## Invariant impact

1. Kill-record integrity remains guarded by `lib/domain/kill.ts`,
   `lib/domain/kill-edit.ts`, and `lib/firebase/kill-repository.ts`.
2. Factual data remains guarded by `lib/gpx/` and the existing location/time
   form logic.
3. Media preservation remains guarded by
   `lib/firebase/storage-repository.ts` and the recoverable-trash flow.
4. Multi-user isolation remains guarded by Firebase Auth, `firestore.rules`,
   `storage.rules`, and emulator rule tests.

The new portfolio data provider is read/subscription orchestration only. It
does not alter schemas, serialization, ownership checks, edit behavior, uploads,
or deletion behavior.

## Rollback

The migration is complete only after the Vite build and clean-route smoke tests
pass. Until then, the archived Next shell provides a local reference and Git
history remains the authoritative rollback source. Vercel production is not
changed during local migration work.
