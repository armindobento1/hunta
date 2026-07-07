# Handoff — Instagram-style flow (2026-07-07)

Read this before resuming work on branch `feat/instagram-flow`. Delete sections
as they complete; delete the file once the branch is merged and device-verified.

## Where things stand
The app was restructured Instagram-style and it works on device (user-tested
via screenshots). Branch `feat/instagram-flow` (branched off
`docs/claude-md-rewrite`, so it carries those docs commits) has two commits:
`755fc59` (feature) and `9d04add` (viewport fix). **Not pushed, no PR.**
All gates passed at commit time: typecheck, lint, test (92/92), build.
`test:rules` not run — no rules/`lib/firebase` changes.

- `/home` — following feed (own + followed hunters' public hunts), post cards
  (`components/social/hunt-post-card.tsx`), trophy → leaderboard in top bar.
- `/discover` — `AccountSearch` + 3-column explore grid of all public hunts.
- Bottom nav: Home / Discover / + / Map / Profile. Auth + welcome page now
  redirect signed-in users to `/home`.
- Backswipe: `components/providers/navigation-gestures.tsx` — left-edge touch
  swipe pops history; Android hardware back via `@capacitor/app` (new dep,
  synced into both native shells).
- Old `SocialFeed`/`SocialDiscovery` moved to `archive/social-v1/` (archive is
  excluded from tsc/eslint/vitest). The portfolio "My hunts / Community"
  toggle was removed — Profile tab is now purely the private portfolio.

## Decisions + why
- **Web-layer edge-swipe instead of native iOS swipe gesture** — Capacitor 8
  has no config-only way to set `allowsBackForwardNavigationGestures` (checked
  `@capacitor/cli` declarations), and the repo policy (vault
  `Decisions/Capacitor-Wrap`) forbids hand-editing `ios/` beyond documented
  config-only files. Don't "fix" this by subclassing the bridge view
  controller without revisiting that decision.
- **Kept the amber/dark brand** — the ui-ux-pro-max skill recommended a rose
  palette; rejected because the brand is a settled decision.
- **Leaderboard left the bottom nav** (replaced by Discover); it's reachable
  from the Home top-bar trophy icon. Route `/portfolio/leaderboard` unchanged.

## Dead ends / gotchas
- **`viewport-fit=cover` was missing from `index.html`** even though the vault
  Capacitor-Wrap note claimed it was added — with it missing,
  `env(safe-area-inset-*)` is 0 in WKWebView and every safe-area padding
  collapses (status-bar collisions on all screens). Fixed in `9d04add`; the
  vault note is now accurate. Pattern used app-wide:
  `max(3rem, calc(env(safe-area-inset-top) + 0.75rem))` — keep the cushion,
  padding by the exact inset leaves content flush against the clock.

## Next steps (cold-startable)
1. On-device pass in Xcode (`npm run cap:ios`): confirm status-bar padding on
   all screens (new-kill editor, discover, profile, home, hunt detail hero),
   backswipe from a kill detail, Android hardware back at root minimizes.
2. Push + PR to `main` when the user asks (never push unasked).
3. **Before Discover ships to strangers:** the security sweep memory records
   OPEN findings — CRITICAL world-readable exact kill location on public
   hunts, HIGH public-hunt takeover. Discover makes exact locations more
   prominent. Fix `firestore.rules` (see memory
   `security-sweep-findings.md` for lines), then `npm run test:rules` +
   security review — escalate to the user before changing rules.

## Fragile bits
- Safe-area CSS is verified by screenshots for the four screens the user sent;
  other screens (auth, trash, farm, public pages) got the same pattern but are
  **unverified on device**.
- `.agents/` untracked dir at repo root — not created by this work, left alone.
