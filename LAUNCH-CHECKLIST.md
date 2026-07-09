# Hunta — App Store Launch Checklist

Work top to bottom; each phase gates the next. Check items off as they're
verified (not just "should work"). Status notes go inline.

## Phase 1 — Blockers: security & code hygiene

> **Status 2026-07-08: deferred by decision.** The location-exposure questions
> (1.1, poaching-relevant) will be discussed and decided later. Still required
> before the public/social surface ships — see the "v1 scope decision" in
> `appstore/submission.md`: shipping v1 private-only removes 1.1/1.2 from the
> launch-critical path.

These block everything else. Findings are from the 2026-07-06 security sweep
(details + line numbers in memory `security-sweep-findings.md`).

- [ ] **1.1 CRITICAL — exact kill location is world-readable.** `publicHunts`
      and `farms` are `allow read: if true` and carry full-precision lat/lng +
      farm name. Fix: coarsen/drop coordinates in `buildPublicHunt`
      (`lib/domain/public-social.ts`) AND add a `validPublicLocation` check in
      `firestore.rules` rejecting full-precision coords. Add a `tests/rules/`
      case for each.
- [ ] **1.2 HIGH — public hunt takeover.** `publicHunts` update rule checks the
      new doc's `ownerId` but not the existing doc's. Fix: add
      `resource.data.ownerId == request.auth.uid` (mirror the delete rule).
      Add a rules test.
- [ ] **1.3 LOW — user enumeration via `publicProfiles` search.** Decide:
      accept for v1 or rate-limit. Record the decision.
- [ ] **1.4** `npm run test:rules` green after 1.1–1.2 + a security re-review
      of the rules diff.
- [ ] **1.5** Merge `feat/instagram-flow` → `main`; all gates green on `main`
      (`typecheck`, `lint`, `test`, `build`).

## Phase 2 — Apple compliance blockers (App Review will reject without these)

- [ ] **2.1 In-app account deletion.** Required by Guideline 5.1.1(v) for any
      app with account creation. Nothing in `src/`, `components/`, or `lib/`
      implements it today. Needs: UI entry point in settings/profile, delete
      Firestore docs + Storage files + the Auth user (Apple/Google re-auth
      before `deleteUser`), confirmation flow. This is a real feature — plan it.
- [x] **2.2 Privacy policy page.** Drafted at `docs/privacy.html`
      (2026-07-08). **Still needed:** confirm contact email
      (armindo1706@gmail.com used), then get the file onto branch
      `codex/firebase-hunting-portfolio-v1` — Pages deploys from there, not
      from main. Live URL will be
      https://armindobento1.github.io/hunta/privacy.html. Note: the deletion
      section assumes in-app account deletion (2.1) ships.
- [x] **2.3 Export compliance key.** `ITSAppUsesNonExemptEncryption = false`
      added to `ios/App/App/Info.plist` (2026-07-08).
- [ ] **2.4 Privacy manifest check.** Confirm the app target needs no own
      `PrivacyInfo.xcprivacy` (Firebase/Capacitor pods ship theirs); verify no
      required-reason API warnings when archiving in Xcode.
- [x] **2.5 App Privacy "nutrition label" prep.** Answers drafted in
      `appstore/submission.md` (2026-07-08) — must stay consistent with
      `docs/privacy.html`.
- [x] **2.6 Age rating decision.** Draft answers in `appstore/submission.md`
      (expect 13+/16+ under Apple's current tiers). Final answers go in when
      filling the ASC form.
- [ ] **2.7 v1 scope decision — public/social surface on or off.** If the
      publish/follow features ship in v1, Apple Guideline 1.2 requires
      report + block + moderation contact (none built), AND finding 1.1
      becomes live. Recommendation in `appstore/submission.md`: ship v1
      private-only. **Decide.**

## Phase 3 — iOS build readiness

- [ ] **3.1 App icon + launch screen.** Single 1024px icon exists
      (`AppIcon-512@2x.png`) — verify it renders correctly on device and the
      launch screen isn't a blank/default storyboard.
- [ ] **3.2 Version/build.** `MARKETING_VERSION = 1.0`, build 1 — fine for
      first submission; bump build number on each upload.
- [ ] **3.3 Release archive builds clean.** `npm run build` → `npx cap sync ios`
      → Xcode Archive with Release config, signed with team `A6848V2683`,
      no warnings that matter.
- [ ] **3.4 Device smoke test (real iPhone, Release build):**
      - [ ] Google sign-in and Apple sign-in both complete
      - [ ] Create a kill: photo, species, date, location + killTime capture
      - [ ] GPX import → distance/time derived → map renders
      - [ ] Feed + group-by-location views correct
      - [ ] Edit a kill without losing core facts (Invariant 1)
      - [ ] Media upload/retry on flaky network; no silent data loss
      - [ ] Safe-area insets look right (recent viewport-fit fix)

## Phase 4 — Firebase production readiness

- [ ] **4.1** Deploy final `firestore.rules` + `storage.rules` to the
      production project; confirm what's deployed matches the repo.
- [ ] **4.2** Firestore composite indexes deployed (any query the app makes
      works against prod, not just emulator).
- [ ] **4.3** Auth: authorized domains correct; Apple + Google providers
      enabled in the prod project; `google-services.json` /
      `GoogleService-Info.plist` match current OAuth clients.
- [ ] **4.4** Billing/quota sanity: Blaze plan if needed for Storage traffic;
      set a budget alert.
- [ ] **4.5** Consider Firebase App Check (attestation) — decide now, even if
      the decision is "post-launch".

## Phase 5 — App Store Connect & submission

- [ ] **5.1** Create the app record (bundle ID `com.onfoothunta.app`, name
      "Hunta" — check name availability).
- [ ] **5.2** Metadata: description, keywords, support URL, marketing URL,
      privacy policy URL — **drafts ready in `appstore/submission.md`**;
      review, then paste into ASC.
- [ ] **5.3** Screenshots: 6.9" and 6.5" iPhone sets (real content, not
      placeholder data).
- [ ] **5.4** Fill App Privacy questionnaire (from 2.5) and age rating
      (from 2.6).
- [ ] **5.5** Upload build → TestFlight → at least a few days of real use on
      TestFlight before submitting.
- [ ] **5.6** App Review demo account. **Problem:** the app only offers
      Google/Apple sign-in, which App Review can't use with a supplied demo
      account. Standard fix: enable Firebase email/password provider + a
      minimal email sign-in path, create a demo account pre-populated with
      sample hunts (photos, GPX route, two countries). Review-notes text
      drafted in `appstore/submission.md`.
- [ ] **5.7** Submit for review.

## Phase 6 — Launch & post-launch

- [ ] **6.1** Crash/error visibility decision (Crashlytics or none — decide
      deliberately).
- [ ] **6.2** Support contact (email on landing page) working.
- [ ] **6.3** Release (manual release after approval recommended for v1).
- [ ] **6.4** Post-launch watch: Firestore usage, Auth errors, review feedback.

---
*Android/Play Store is a separate pass — the Capacitor shell exists but this
checklist is iOS-only per current goal.*
