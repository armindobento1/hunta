# App Store submission pack — Hunta

Everything to copy into App Store Connect. Drafted 2026-07-08; review each
section before pasting. Placeholders needing a decision are marked **[confirm]**.

## App identity

| Field | Value |
|---|---|
| App name | Hunta **[confirm availability in ASC — fallback: "Hunta — Hunting Portfolio"]** |
| Subtitle (30 chars) | `Your hunting portfolio` |
| Bundle ID | `com.onfoothunta.app` |
| SKU | `hunta-ios-001` |
| Primary category | Sports |
| Secondary category | Lifestyle |
| Price | Free |

## URLs

| Field | Value |
|---|---|
| Marketing URL | https://armindobento1.github.io/hunta/ |
| Privacy Policy URL | https://armindobento1.github.io/hunta/privacy.html |
| Support URL | https://armindobento1.github.io/hunta/ **[confirm — a mailto or a simple support section on the landing page also works]** |

> Deploy note: `docs/privacy.html` must be on branch
> `codex/firebase-hunting-portfolio-v1` for GitHub Pages to serve it — Pages
> does NOT build from `main` or `feat/instagram-flow`.

## Description (draft)

```
Every great hunt has a story. Hunta keeps yours.

Hunta is your private hunting portfolio — a complete, organized record of
every hunt, built the way hunters actually remember them: by country, by
season, by species.

THE COMPLETE RECORD
Log each hunt as one card: the animal, your photos and videos, the exact
date and time, the weapon and caliber or bow, the ammunition, and the story
of the stalk in your own words.

THE WALK, ON THE MAP
Import the GPX track from your Garmin or Strava and see your route drawn
over satellite imagery — with the distance you covered and how long the
stalk took, derived from the real track.

YOUR PORTFOLIO, YOUR EYES ONLY
Everything you record is private by default. Your locations, your records,
your photos — visible to you alone, protected by your Google or Apple
account.

ORGANIZED LIKE A HUNTER THINKS
Flip through your hunts as a chronological feed, or browse them grouped by
country and place. Ten seasons from now, every detail will still be there.

Hunta is built for hunters who treat their records with the same respect
they treat the hunt.
```

## Keywords (100 chars max)

```
hunting,hunt,log,journal,trophy,portfolio,deer,stalk,rifle,bow,gpx,track,diary,season,record
```
(95 chars — verify count after any edit.)

## Promotional text (170 chars, editable without review)

```
Your private hunting portfolio: every hunt logged with photos, weapon,
exact location and the GPX route on a satellite map. Private by default.
```

## App Privacy questionnaire (nutrition label)

Data collection: **Yes**. Tracking (ATT sense): **No** for everything.
All items below: *linked to the user's identity*, purpose *App Functionality*
only.

| ASC data type | What it is in Hunta |
|---|---|
| Contact Info → Name | From Google/Apple sign-in |
| Contact Info → Email Address | From Google/Apple sign-in |
| Identifiers → User ID | Firebase Auth UID |
| Location → Precise Location | Hunt location (GPS or user-entered) + GPX routes |
| User Content → Photos or Videos | Hunt media |
| User Content → Other User Content | Hunt records (species, weapon, description) |

Not collected: browsing history, search history, purchase data, financial
info, health, contacts, usage data, diagnostics (no Crashlytics/analytics —
re-verify before submitting if that changes), advertising data.

These answers must stay consistent with `docs/privacy.html`.

## Age rating questionnaire (draft answers)

Apple's rating tiers are 4+ / 9+ / 13+ / 16+ / 18+. Suggested answers —
expect a **13+ or 16+** result:

- Realistic violence: **Infrequent/Mild** (user photos of hunted animals;
  the app itself depicts no violence)
- Weapons: the app references real weapons (rifles, bows) as record metadata
- All other categories (sexual content, profanity, horror, gambling,
  drugs/alcohol/tobacco, contests): **None**
- Unrestricted web access: **No**
- User-generated content: see decision below

## v1 scope decision — public/social surface (**decide before submitting**)

If the publish/follow/leaderboard features are enabled in the submitted
build, two extra requirements apply:

1. **Guideline 1.2 (UGC):** public user content requires report + block
   mechanisms and a moderation contact. None of this exists yet.
2. The **CRITICAL world-readable-location finding** (LAUNCH-CHECKLIST 1.1)
   becomes a live poaching-relevant exposure on day one.

**Recommendation: ship v1 private-portfolio-only** (public surface feature-
flagged off). This sidesteps both, matches the "private by default" story
Apple sees in the privacy label, and the social layer ships in an update
once the location handling is decided and report/block exists.

## App Review notes (paste into "Notes" + demo account fields)

```
Hunta is a private hunting portfolio. Each user's records are visible only
to that user (Firebase Auth + per-user security rules).

Demo account (Google sign-in is not usable by reviewers, so this account
uses email/password — see note below): [DEMO EMAIL / PASSWORD]

The demo account is pre-populated with sample hunt records including
photos, a GPX route rendered on the satellite map, and records across two
countries so both the feed view and the group-by-location view show data.

Location permission is requested only when the user records where a hunt
took place. The camera/photo permissions are used to attach media to a
hunt record.
```

**[confirm]** Review sign-in problem: the app currently offers only
Google/Apple sign-in, which App Review cannot use with a demo account. Two
options: (a) enable Firebase email/password provider and build a minimal
hidden/plain email sign-in so a demo account works, or (b) rely on Sign in
with Apple + reviewer's own Apple ID — but then the reviewer sees an EMPTY
portfolio, which risks a metadata rejection. Option (a) is the standard
solution. → tracked as checklist item 5.6.

## Screenshot plan (6.9" required; 6.5" reusable from same)

1. Feed view populated with sample hunts (hero shot)
2. A kill card open — photo, species, weapon/ammo details
3. Satellite map with GPX route drawn
4. Group-by-location view (countries)
5. Kill form / adding a record

Real-looking sample data, no placeholder text visible.
