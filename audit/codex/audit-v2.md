# Audit: Buttons & interactions — v2

- **Author:** claude-code (writing this brief on the user's behalf)
- **Role:** brief / scope request for the auditor
- **Auditor:** codex (fills in Findings, Re-review, Sign-off)
- **Date:** 2026-07-12
- **Status:** open — auditor pass complete; awaiting implementer v2.1

## Purpose

A focused, product-facing audit: **does every button and interaction in the app
actually work, go where it should, and behave the way a user coming from
Instagram would expect?** v1.1 covered privacy/security/perf; this pass is about
interaction correctness and completeness across the whole app — especially the
social surface, which is now live in production (`VITE_SOCIAL_ENABLED=true` in
Vercel prod).

This is not a request for a redesign. It is: click/tap everything, find the
controls that are dead, mis-wired, missing, or that only work with a mouse and
not a finger, and report them.

## How to run it

Test against the deployed production app and the local dev build (dev has social
on via `.env.local`). Where a control's behavior depends on auth or on another
user existing, say so and test with at least two accounts (a viewer and a
separate profile to follow / whose hunt to like/comment on). For each finding,
give the concrete file:line, what the user does, what happens, and what should
happen.

## Severity

- **P0** — control is completely broken/dead, or destroys/mis-saves data.
- **P1** — core interaction wrong or missing (a thing the user expects to be
  able to do and can't).
- **P2** — works but wrong target, wrong state, or broken on touch / no keyboard
  or focus support.
- **P3** — polish (animation, hover, minor affordance).

## Scope — the interactions to verify

### 1. Every button / link has a working handler and correct target
Sweep all of `components/` and `src/pages/`. For each interactive control
(`<button>`, `<Link>`, `onClick`, `onDoubleClick`, tab, FAB, icon button):
- it does something (no dead/no-op handlers);
- it navigates to a route that exists (no broken `to=`/`navigate()` targets);
- disabled / signed-out / loading states are correct (e.g. like/comment
  disabled when `!viewerId`);
- destructive actions (delete comment, trash, remove media, delete account)
  confirm and actually do the thing.
Cover the non-social app too: bottom tab bar, "Log a kill" FAB, profile
Feed/By-location/Armory segmented tabs, kill form section controls, GPX picker,
media picker, trash restore, armory/loadout builder buttons, notifications rows.

### 2. Double-tap to like (feed card)
`components/social/hunt-post-card.tsx:40,58` — `doubleTapLike` is wired to
`onDoubleClick` on `.soc-media`.
- Verify it actually fires **on a touch device** (mobile Safari / the Capacitor
  wrap). `onDoubleClick` maps to the DOM `dblclick` event, which many touch
  browsers do **not** emit — this may work with a mouse and silently do nothing
  on a phone. If so, it needs real touch handling (tap-count / timing).
- Heart-burst animation shows; it likes only when signed in and not already
  liked; a second double-tap does not unlike (matches IG).

### 3. Tapping a person in the comment section opens their profile
`components/social/hunt-engagement.tsx` — comment and reply avatars/names render
as `initials(comment.authorName)` / `<b>{authorName}</b>` and are **not links**.
Expected (IG behavior): tapping a commenter's avatar or name navigates to
`/people/{authorId}`. Confirm whether this is missing (likely) and flag it. Note
comments store `authorId`, so the link target is available.

### 4. Viewing who liked a post
`components/social/hunt-engagement.tsx:100-120` shows a likes **facepile +
count** only; `hunt-post-card.tsx` shows a "Liked by …" line. There is no screen
that lists everyone who liked a post.
Expected (IG behavior): tapping the like count / "N likes" opens a **likers
list** — each row a profile pic, display name linking to `/people/{id}`, and a
Follow / Following toggle (same row UI as the followers list). Confirm this
screen/route does not exist and specify what's needed (likes data is already
subscribed via `useHuntEngagement`; each like has `likerId` + `likerName`, but
**not** an avatar URL — flag that the liker avatar may need to be denormalized
onto the like doc or fetched from the public profile).

### 5. Followers / Following lists (Instagram-style)
`src/pages/follow-list-page.tsx` already renders avatar (or initials), a name
linking to `/people/{id}`, and a Follow/Following toggle button. Verify it
**works end to end**, not just that it renders:
- opening from a profile's "followers" / "following" counts
  (`components/social/public-profile-view.tsx:90-94`,
  `components/portfolio/follow-stats.tsx`) lands on the right list with the
  right count;
- real profile pictures load (not just initials) when the user has an avatar;
- the Follow/Following button toggles, persists, and reflects the viewer's own
  follow state live;
- your own row shows no follow button; an empty list shows a sensible empty
  state.
If any of that is only half-wired, report it.

### 6. All back buttons
Every screen with a back control uses `navigate(-1)` with **no fallback**:
`follow-list-page.tsx:28`, `hunt-engagement.tsx:183`, `public-profile-view.tsx:68`,
`public-hunt-detail.tsx:89`, `notifications-page.tsx`, `kill-detail-page.tsx`.
- On a **deep link opened in a fresh tab or the native app** (history index 0),
  `navigate(-1)` has nowhere to go — the back button is dead or leaves the app.
- `components/providers/navigation-gestures.tsx:24-33` already guards with
  `historyIndex() > 0`; page-level back buttons do **not** use that guard.
Expected: every back control has an explicit fallback route (e.g. to the feed,
the parent profile, or the portfolio) when there is no history to pop. (This is
v1.1 finding F-17 seen from the interaction side — cross-reference it.)

### 7. Cross-checks
- Share buttons (`public-profile-view.tsx`, `public-hunt-detail.tsx` use
  `navigator.clipboard` / share) do something visible and don't throw where the
  API is unavailable.
- Public hunt/comment routes carry `:uid` and `:publicHuntId`; confirm a
  mismatched `uid` (someone else's path) doesn't render the wrong owner's hunt
  (v1.1 F-17 owner-mismatch — verify from the navigation angle).
- Notifications rows tap through to the right hunt/profile
  (`notifications-page.tsx`).

## Out of scope
Visual design/theming, copy, and the privacy/perf/rules findings already tracked
in v1.1 (`audit/codex/audit-v1.1.md` / `audit/claude-code/audit-v1.2.md`). If an
interaction bug overlaps a v1.1 finding, reference it rather than re-filing.

## Deliverable
Findings list with severity, `file:line`, repro (what you tap → what happens →
what should happen), and a suggested fix direction. Group by the sections above.
Claude Code implements; only Codex signs off after re-review.

---

## Auditor sections (codex) — to be filled

### Findings

#### F2-01 — Feed double-tap is mouse-only, so the mobile gesture is not implemented — P1

**Evidence / repro**

- `components/social/hunt-post-card.tsx:40-44,58` attaches the behavior only to
  React `onDoubleClick`, which listens for the browser `dblclick` event. There
  are no touch/pointer handlers or tap timing state anywhere on the card.
- Mouse double-click can call `doubleTapLike`, but two taps on mobile Safari or
  in the Capacitor web view have no application-level gesture handler. This is
  therefore dependent on inconsistent browser click synthesis and is not a
  supported touch interaction.
- The mutation guard itself is correct: `viewerId && !likedByMe` means a second
  successful double-tap will not unlike the hunt.

**Expected / fix direction**

Handle two primary-pointer/touch taps inside a short time-and-distance window,
cancel the pending single-tap state cleanly, and keep the existing signed-in /
already-liked guard and heart burst. Add fake-timer interaction tests for first
double-tap, already-liked double-tap, signed-out taps, and taps outside the
window.

#### F2-02 — Comment and reply identities are not profile links — P1

**Evidence / repro**

- Production comments for a real public hunt rendered the commenter avatar and
  name as plain generic text; there was no link to the commenter.
- `components/social/hunt-engagement.tsx:43-49,126-140` renders the name in
  `<b>` and both avatars in `aria-hidden` `<span>` elements even though every
  comment has `authorId`.
- Tap a root commenter's avatar/name or a reply avatar/name: nothing happens.

**Expected / fix direction**

Wrap both avatar and author name in links to `/people/${comment.authorId}` (and
the reply equivalent), with an accessible name on the avatar link. Preserve the
AUTHOR chip and comment text outside the link.

#### F2-03 — Like totals and liker names are display-only; no likers list exists — P1

**Evidence / repro**

- Production rendered `2 likes · Armindo and James` as generic text on the
  comments screen. It was not interactive.
- The feed line is a `<div>` in `components/social/hunt-post-card.tsx:11-23`,
  the comments facepile/count is plain markup in
  `components/social/hunt-engagement.tsx:100-109`, and the detail count is plain
  markup in `components/social/public-hunt-detail.tsx:178-184`.
- `src/router.tsx:37-59` has no likers route. `HuntLike` stores only
  `likerId`/`likerName`, so the requested row avatar is also unavailable without
  resolving the public profile or denormalizing an avatar URL.

**Expected / fix direction**

Add one canonical likers route/screen for a public hunt and make the like count,
facepile/summary, and feed "Liked by" line open it. Each row should resolve the
public profile, link to `/people/{likerId}`, show avatar/name, hide the toggle on
the viewer's own row, and reuse the live Follow/Following control.

#### F2-04 — v1.1 F-17 is still reproducible: Back exits a fresh deep link and `:uid` is ignored — P2

**Evidence / repro**

- Opening a local public-profile deep link in a fresh browser tab and pressing
  its Back control navigated to `about:blank`, leaving Hunta.
- The four remaining page controls still call `navigate(-1)` directly:
  `src/pages/follow-list-page.tsx:28`,
  `components/social/public-profile-view.tsx:68`,
  `components/social/public-hunt-detail.tsx:89`, and
  `components/social/hunt-engagement.tsx:183`.
- In production, opening
  `/people/not-the-owner/hunts/{valid-hunt-id}` rendered the valid hunt and its
  real owner while retaining the false owner URL. `src/pages/public-hunt-page.tsx:7`
  and `src/pages/hunt-comments-page.tsx:8-16` still ignore `uid`.

**Expected / fix direction**

Close v1.1 F-17 rather than filing a separate implementation: centralize a
history-index-aware back helper with an explicit route-specific fallback, and
reject or canonical-redirect public hunt/comment URLs when `hunt.ownerId !==
uid`.

#### F2-05 — Followers/following are only partly live and the private profile opens a different, incomplete list UI — P2

**Evidence / repro**

- The production public followers route loaded the right count, profile links,
  and real avatar images where available. The current viewer's row is correctly
  excluded from follow controls by `src/pages/follow-list-page.tsx:47-55`.
- However, the list is a one-time `getDocs` result
  (`src/pages/follow-list-page.tsx:16-23`). On the viewer's own Following screen,
  unfollowing changes the button through `useViewerFollowing`, but the removed
  account remains in the list until reload.
- Counts are also one-shot (`lib/hooks/use-follow-stats.ts:9-15`), so a follow
  toggle does not update the displayed total live.
- The private profile counts do not open the Instagram-style route at all:
  `components/portfolio/follow-stats.tsx:10-29` expands an inline text-only list
  with no avatars or Follow/Following controls.
- Authenticated persistence/toggle behavior could not be mutated in production
  without authorized test-account credentials; repository code and rules tests
  support the write path, but the required two-account runtime proof remains
  outstanding.

**Expected / fix direction**

Use the same list screen from both public and private profile counts. Subscribe
to (or reconcile locally after mutation) list membership and counts so an
unfollow removes the row and totals change without reload. Add a two-viewer
integration test for follow, unfollow, own-row suppression, avatars, empty
state, and persistence after remount.

#### F2-06 — Delete comment is immediate and unconfirmed — P2

**Evidence / repro**

- `components/social/hunt-engagement.tsx:60-68,131-143` shows Delete to the
  comment author or hunt owner and immediately calls `removeComment`.
- `lib/hooks/use-engagement.ts:57-62` immediately deletes the Firestore document.
  There is no confirmation, undo, or pending/disabled state, unlike trash,
  account, armory-item, and loadout deletion elsewhere in the app.

**Expected / fix direction**

Require an explicit confirmation (or a reliable undo workflow) before the
mutation, disable repeat submission while pending, and surface success/failure.
Cover both author deletion and hunt-owner moderation in interaction tests.

#### F2-07 — Copy/share controls can fail silently or produce an unhandled rejection — P2

**Evidence / repro**

- `components/social/public-profile-view.tsx:45-63` and
  `components/social/public-hunt-detail.tsx:80-84` call
  `navigator.clipboard.writeText` directly.
- The menu handlers intentionally discard the returned promise
  (`public-profile-view.tsx:75`, `public-hunt-detail.tsx:99`), so an unavailable
  or denied Clipboard API rejects without an in-app error state. `shareProfile`
  catches every failure, including non-cancel failures, and returns with no
  feedback.

**Expected / fix direction**

Feature-detect Clipboard and Web Share, distinguish `AbortError` from real
failures, provide a safe copy fallback where possible, and always show a visible
success or error status. Test missing APIs and rejected permissions.

#### F2-08 — The public-hunt Save control is a shipped non-interaction — P1

**Evidence / repro**

- Production renders a disabled `Save — coming soon` bookmark.
- `components/social/public-hunt-detail.tsx:170-175` hard-codes the button as
  disabled and confirms there is no backend. It can never work for any viewer.

**Expected / fix direction**

Either implement saved hunts end to end (viewer-owned persistence, live pressed
state, and a place to view saved hunts) or remove the control from the shipped
surface until it is functional. A permanently disabled Instagram-style action
does not meet this audit's "every control works" requirement.

### Checks with no new finding

- Static route/handler sweep found no other `Link`/`navigate()` target pointing
  at a nonexistent enabled route.
- Bottom navigation, Log-a-kill FAB, portfolio tabs/display toggle, kill-form
  controls, GPX/media pickers, trash restore/confirmation, loadout builder, and
  account deletion all have concrete handlers and appropriate private-route
  targets. Existing destructive private actions confirm before deleting.
- Notification rows use `/people/{actorId}` for follows and the recipient's hunt
  route for like/comment notifications; the row link also marks unread entries.
- Public follower/following routes show an empty state and resolve profile
  avatars/names. Signed-out rows correctly omit Follow controls.

### Verification performed

- Production: `https://onfoothunta.vercel.app` landing page, public profile,
  followers, public hunt, comments, mismatched-owner URL, and fresh-entry Back.
- Local: Vite build with `VITE_SOCIAL_ENABLED=true`, public profile deep link,
  route rendering, and fresh-entry Back.
- `npm run typecheck` — passed.
- `npm run lint` — passed.
- `npm run test` — passed (24 files, 113 tests).
- `npm run build` — passed; Vite reported the existing large-chunk warning.
- `npm run test:rules` — not run; this auditor pass changed no rules or
  `lib/firebase/` code.
- Limitation: no authorized second account/session was available, so follow,
  like, comment, delete, and notification mutations were not performed against
  production. Those paths were reviewed in code/rules; implementer verification
  must supply the requested two-account runtime evidence.

### Re-review
Pending Claude Code v2.1 implementation response.

### Sign-off
Not signed off. F2-01 through F2-08 remain open.
