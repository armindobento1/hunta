# Hunta Vite + React Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Next.js runtime with a Vite + React Router SPA while preserving Hunta behavior, clean URLs, Firebase isolation, and future Capacitor compatibility.

**Architecture:** Build a Vite entry and browser-history route tree over the existing reusable components and Firebase/domain layers. Keep auth and portfolio subscriptions mounted across private navigation, provide a Vercel SPA fallback, then exclude the archived Next shell from the active toolchain.

**Tech Stack:** Vite, React 19, React Router, TypeScript, Tailwind CSS 4, Firebase, Vitest, Vercel.

---

## File map

- `index.html` — Vite document and Hunta metadata.
- `vite.config.ts` — Vite React build and `@/` alias.
- `src/main.tsx` — browser entry.
- `src/app.tsx` — root providers and route tree.
- `src/pages/` — route-level page components.
- `src/providers/portfolio-data-provider.tsx` — persistent private data subscriptions.
- `src/test/render-router.tsx` — router-aware component test helper.
- `vercel.json` — clean-URL SPA fallback.
- `lib/firebase/config.ts` — validated `VITE_*` environment access.
- `components/**` — replace Next navigation APIs with React Router APIs.
- `app/**` and `next.config.ts` — retained as excluded migration archive.
- `package.json`, `package-lock.json`, `tsconfig.json`, `eslint.config.mjs`, `vitest.config.ts` — active Vite toolchain.
- `.env.example`, `README.md`, `AGENTS.md`, `vault/0-Overview/System-Architecture.md`, `vault/Frontend/Portfolio-v1.md` — operator and stable architecture docs.

## Task 1: Establish route contracts before the shell changes

- [x] Add router tests for `/`, `/auth`, `/portfolio`, `/portfolio/kills/new`, `/portfolio/kills/:killId`, `/portfolio/kills/:killId/edit`, `/portfolio/profile`, `/portfolio/trash`, and unknown routes.
- [x] Add auth-guard tests proving private redirects and authenticated auth-page redirects.
- [x] Run the targeted tests and verify they fail because the Vite router does not exist.

## Task 2: Create the Vite shell and clean route tree

- [x] Add Vite/React Router dependencies and production scripts.
- [x] Create `index.html`, `vite.config.ts`, `src/main.tsx`, `src/app.tsx`, route pages, and the not-found page.
- [x] Add `vercel.json` with a filesystem-first SPA fallback.
- [x] Replace Next `Link`, `useRouter`, and `useParams` usage with React Router equivalents.
- [x] Run route tests and verify they pass.

## Task 3: Preserve loaded portfolio data across private navigation

- [x] Add a failing provider test proving profile and kill subscriptions mount once across private route changes and reset on UID changes.
- [x] Implement `PortfolioDataProvider` and context-backed `useProfile`/`useKills` access.
- [x] Keep first-login profile creation and existing safe errors unchanged.
- [x] Run provider and portfolio tests and verify they pass.

## Task 4: Convert environment and toolchain configuration

- [x] Replace `process.env.NEXT_PUBLIC_*` access with validated `import.meta.env.VITE_*` access.
- [x] Rename example and local public Firebase variable names without printing values.
- [x] Remove active Next compiler, ESLint, and Vitest assumptions; exclude the archived shell.
- [x] Remove `next` and `eslint-config-next` after active imports reach zero.
- [x] Run typecheck, lint, and unit tests.

## Task 5: Verify production and clean-URL behavior

- [x] Build and verify `dist/index.html` plus hashed assets exist.
- [x] Serve `dist/` through an SPA fallback and smoke-test every direct clean URL.
- [x] Verify Hunta title/branding, auth redirect, dynamic kill routes, and browser console health.
- [x] Run Firebase rule tests with Java 21.

## Task 6: Update stable documentation and final gates

- [x] Update README, AGENTS, system architecture, and Portfolio v1 notes from Next/Vercel-runtime wording to Vite SPA wording.
- [x] Record that Capacitor and native folders remain deferred.
- [x] Run `npm run typecheck`, `npm run lint`, `npm test`, `npm run test:rules`, `npm run build`, and `git diff --check`.
- [x] Inspect the final diff without staging, committing, pushing, deploying, or changing external Vercel settings.
