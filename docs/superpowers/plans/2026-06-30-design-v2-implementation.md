# Design v2 Implementation Plan
**Date:** 2026-06-30  
**Source designs:** `Hunting Portfolio App 2/` (`.dc.html` files)  
**Implementer:** Codex

---

## Overview

Implement the full iOS-style redesign from the `Hunting Portfolio App 2/` design files. This touches the domain model, all existing UI components, the CSS layer, two new pages (Armory, Leaderboard), and the router.

**Read before starting:**
- `Hunting Portfolio App 2/FeedScreen.dc.html` — profile + feed layout and color tokens
- `Hunting Portfolio App 2/KillCard.dc.html` — all 4 card variants
- `Hunting Portfolio App 2/TabBar.dc.html` — 5-tab bar
- `Hunting Portfolio App 2/ArmoryScreen.dc.html` — gear library + loadouts
- `Hunting Portfolio App 2/LogKillScreen.dc.html` — updated kill form
- `Hunting Portfolio App 2/LeaderboardScreen.dc.html` — species leaderboard

**Verification gate — run all before marking done:**
```
npm run typecheck
npm run lint
npm run build
```

---

## 1. Design System Tokens

### Color palette (add to `:root` in `src/styles/globals.css`)

```css
:root {
  /* Light mode */
  --page-bg: #ffffff;
  --card-bg: #ffffff;
  --cover-bg: #e9e9ec;
  --text: #1c1c1e;
  --body: #3c3c43;
  --muted: #8e8e93;
  --sep: rgba(60, 60, 67, 0.13);
  --input-bg: #f5f5f7;
  --input-border: rgba(60, 60, 67, 0.13);
  --unit-bg: #ececef;
  --seg-track: rgba(118, 118, 128, 0.12);
  --seg-active-bg: #ffffff;
  --seg-active-text: #1c1c1e;
  --seg-shadow: 0 1px 3px rgba(0,0,0,0.14), 0 1px 1px rgba(0,0,0,0.06);
  --accent: #1f3d2b;
  --accent-btn: #1f3d2b;
  --accent-shadow: rgba(31, 61, 43, 0.32);
  --accent-tint-bg: #e8f0ea;
  --accent-tint-text: #1f3d2b;
  --frost: rgba(255, 255, 255, 0.8);
  --tab-idle: #9a9aa0;
  --dashed: rgba(60, 60, 67, 0.22);
  --map-bg: #eef1ee;
  --map-line: rgba(31, 61, 43, 0.07);
  --map-chip: rgba(255, 255, 255, 0.85);
  --req-field-bg: rgba(31, 61, 43, 0.04);
  --req-badge-bg: #e8f0ea;
  --req-glow: rgba(31, 61, 43, 0.1);
  /* Loadout card — always dark regardless of mode */
  --loadout-bg: #0e1f16;
  --loadout-head: linear-gradient(180deg, #15301f 0%, #0e1f16 100%);
  --loadout-border: rgba(255, 255, 255, 0.06);
  --loadout-shadow: rgba(14, 31, 22, 0.3);
  --loadout-text: #ffffff;
  --loadout-muted: rgba(255, 255, 255, 0.55);
  --loadout-sep: rgba(255, 255, 255, 0.1);
  --crest-bg: rgba(111, 191, 140, 0.18);
  --crest-text: #9fe3b8;
  --def-bg: rgba(111, 191, 140, 0.2);
  --def-dot: #6fbf8c;
  --def-text: #9fe3b8;
  --loadout-btn: rgba(255, 255, 255, 0.1);
  --loadout-btn-text: #ffffff;
  --set-def-border: rgba(255, 255, 255, 0.2);
}

@media (prefers-color-scheme: dark) {
  :root {
    --page-bg: #000000;
    --card-bg: #1c1c1e;
    --cover-bg: #15171a;
    --text: #ffffff;
    --body: #c7c7cc;
    --muted: #98989f;
    --sep: rgba(84, 84, 88, 0.55);
    --input-bg: #1c1c1e;
    --input-border: rgba(84, 84, 88, 0.5);
    --unit-bg: #242427;
    --seg-track: rgba(118, 118, 128, 0.24);
    --seg-active-bg: #636366;
    --seg-active-text: #ffffff;
    --seg-shadow: none;
    --accent: #6fbf8c;
    --accent-btn: #2e7d4f;
    --accent-shadow: rgba(46, 125, 79, 0.45);
    --accent-tint-bg: rgba(79, 158, 107, 0.18);
    --accent-tint-text: #6fbf8c;
    --frost: rgba(20, 20, 22, 0.72);
    --tab-idle: #7c7c82;
    --dashed: rgba(120, 120, 128, 0.4);
    --map-bg: #121417;
    --map-line: rgba(255, 255, 255, 0.05);
    --map-chip: rgba(0, 0, 0, 0.55);
    --req-field-bg: rgba(46, 125, 79, 0.1);
    --req-badge-bg: rgba(46, 125, 79, 0.18);
    --req-glow: rgba(46, 125, 79, 0.25);
    --loadout-bg: #16181b;
    --loadout-head: linear-gradient(180deg, #1b2a21 0%, #16181b 100%);
    --loadout-border: rgba(111, 191, 140, 0.18);
    --loadout-shadow: rgba(0, 0, 0, 0.5);
  }
}
```

### Typography

Replace `Inter` with the iOS system font stack everywhere. Update `body` font-family in `globals.css`:

```css
body {
  font-family: -apple-system, 'SF Pro Text', 'SF Pro Display', system-ui, sans-serif;
}
```

Monospace spans (weapon badges, stat labels, loadout labels) use:
```css
font-family: 'SF Mono', ui-monospace, monospace;
```

---

## 2. Domain Model Changes

### 2a. `lib/domain/kill.ts` — add `farmName` and `measurement`

**`killLocationSchema`** — add `farmName` as required field:
```ts
export const killLocationSchema = z
  .object({
    latitude: z.number().finite().min(-90).max(90),
    longitude: z.number().finite().min(-180).max(180),
    placeName: trimmed(160),
    farmName: trimmed(200),   // ← ADD THIS (required)
  })
  .strict();
```

**New `measurementSchema`** — add after `ammunitionSchema`:
```ts
export const measurementSchema = z
  .object({
    score: z.number().finite().positive().optional(),
    scoreUnit: z.string().trim().max(40).optional(),
    scoringSystem: z.string().trim().max(80).optional(),
    weightDressed: z.number().finite().positive().optional(),
    weightUndressed: z.number().finite().positive().optional(),
    weightUnit: z.enum(['kg', 'lb']).optional(),
  })
  .strict();
```

**`killSchema`** — add `measurement` field (optional):
```ts
measurement: measurementSchema.optional(),
```

Add to exports:
```ts
export type Measurement = z.infer<typeof measurementSchema>;
```

### 2b. `lib/domain/kill-edit.ts` — expose `measurement`

Add `measurement` to `KillEdit` and `editableKeys`:
```ts
measurement?: Measurement;   // in KillEdit type
'measurement',               // in editableKeys array
```

Import `Measurement` from `./kill`.

### 2c. `components/kills/types.ts` — add new form fields

Add to `KillFormSubmission`:
```ts
farmName: string;
measureScore: number | null;
measureScoreUnit: string;
measureScoringSystem: string;
measureWeightDressed: number | null;
measureWeightUndressed: number | null;
measureWeightUnit: 'kg' | 'lb';
```

### 2d. `lib/firebase/serialization.ts`

No changes needed — Firestore serialization is schema-driven via `killSchema.parse()`, so new fields round-trip automatically once the schema accepts them.

---

## 3. Kill Form Updates

### 3a. `components/kills/kill-form.tsx`

**Add to `EditorFields`:**
```ts
farmName: string;
measureScore: number;
measureScoreUnit: string;
measureScoringSystem: string;
measureWeightDressed: number;
measureWeightUndressed: number;
measureWeightUnit: 'kg' | 'lb';
```

**Add to `defaults()`:**
```ts
farmName: initial?.location.farmName ?? '',
measureScore: Number.NaN,
measureScoreUnit: 'in',
measureScoringSystem: 'SCI',
measureWeightDressed: Number.NaN,
measureWeightUndressed: Number.NaN,
measureWeightUnit: 'kg',
```

**Update the `onSave` call** to include `farmName` and measurement fields from `values`.

**Add measurements section** between LocationFields and WeaponFields (section `04`):

```tsx
<section className="editor-section" aria-labelledby="measurements-heading">
  <div className="section-heading">
    <div>
      <p>04</p>
      <h2 id="measurements-heading">Measurements</h2>
    </div>
    <span>Optional</span>
  </div>
  <p className="section-hint">Add trophy detail later if you don't have it now.</p>
  <FormField label="Score / size · SCI / Rowland Ward" htmlFor="measure-score">
    <div className="input-with-unit">
      <Input
        id="measure-score"
        type="number"
        step="any"
        placeholder="e.g. 53 ⅜"
        {...register('measureScore', { valueAsNumber: true })}
      />
      <select className="unit-select" {...register('measureScoreUnit')}>
        <option value="in">in</option>
        <option value="cm">cm</option>
        <option value="pts">pts</option>
      </select>
    </div>
  </FormField>
  <div className="editor-grid two-columns">
    <FormField label="Dressed weight" htmlFor="weight-dressed">
      <div className="input-with-unit">
        <Input id="weight-dressed" type="number" step="any" placeholder="—"
          {...register('measureWeightDressed', { valueAsNumber: true })} />
        <span className="unit-label">kg</span>
      </div>
    </FormField>
    <FormField label="Undressed weight" htmlFor="weight-undressed">
      <div className="input-with-unit">
        <Input id="weight-undressed" type="number" step="any" placeholder="—"
          {...register('measureWeightUndressed', { valueAsNumber: true })} />
        <span className="unit-label">kg</span>
      </div>
    </FormField>
  </div>
</section>
```

Renumber subsequent sections: WeaponFields becomes `05`, GPX becomes `06`, Hunt Story becomes `07`.

### 3b. `components/kills/location-fields.tsx`

Add `farmName` as the **first field** in the section, styled as a required highlighted field:

```tsx
<div className="req-field-wrapper">
  <div className="req-field-header">
    <span className="req-field-label">
      Farm name <span className="req-asterisk">*</span>
    </span>
    <span className="req-badge">
      <span className="req-dot" />
      REQUIRED
    </span>
  </div>
  <Input
    id="farm-name"
    placeholder="e.g. Welgevonden Game Reserve"
    {...register('farmName', { required: 'Farm name is required.' })}
    aria-describedby="farm-name-error"
  />
  {errors.farmName && (
    <p id="farm-name-error" className="field-error" role="alert">
      {errors.farmName.message}
    </p>
  )}
</div>
```

CSS for the required field highlight (add to globals.css):
```css
.req-field-wrapper {
  border: 1.5px solid var(--accent);
  border-radius: 13px;
  background: var(--req-field-bg);
  padding: 12px 13px 13px;
  margin-bottom: 12px;
  box-shadow: 0 1px 6px var(--req-glow);
}
.req-field-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 7px;
}
.req-field-label {
  font-size: 12.5px;
  font-weight: 700;
  color: var(--text);
}
.req-asterisk { color: var(--accent); }
.req-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  border-radius: 11px;
  background: var(--req-badge-bg);
  font-size: 9.5px;
  font-weight: 700;
  letter-spacing: 0.4px;
  color: var(--accent);
  font-family: 'SF Mono', ui-monospace, monospace;
}
.req-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--accent);
}
```

Also add `farmName` to `EditorFields` and ensure it's wired through `LocationFields` props.

### 3c. `lib/hooks/use-kills.ts` (or wherever the kill save logic lives)

When constructing the `Kill` object from `KillFormSubmission`, map the new fields:

```ts
location: {
  latitude: submission.latitude,
  longitude: submission.longitude,
  placeName: submission.placeName,
  farmName: submission.farmName,
},
measurement: {
  score: Number.isFinite(submission.measureScore) ? submission.measureScore : undefined,
  scoreUnit: submission.measureScoreUnit || undefined,
  scoringSystem: submission.measureScoringSystem || undefined,
  weightDressed: Number.isFinite(submission.measureWeightDressed) ? submission.measureWeightDressed : undefined,
  weightUndressed: Number.isFinite(submission.measureWeightUndressed) ? submission.measureWeightUndressed : undefined,
  weightUnit: submission.measureWeightUnit || undefined,
},
```

---

## 4. KillCard Component Overhaul

**File:** `components/portfolio/kill-card.tsx`

Replace entirely. The component now supports four variants: `overlay` (default), `below`, `compact`, `grid`.

```tsx
import { Link } from 'react-router-dom';
import type { Kill } from '@/lib/domain/kill';

type Variant = 'overlay' | 'below' | 'compact' | 'grid';

function weaponLabel(kill: Kill): string {
  return kill.weapon.type === 'rifle' ? kill.weapon.caliber : 'BOW';
}

function formatDate(date: string): string {
  return new Intl.DateTimeFormat('en', {
    day: 'numeric', month: 'short', year: 'numeric',
  }).format(new Date(`${date}T00:00:00`));
}

export function KillCard({
  kill,
  variant = 'overlay',
}: {
  kill: Kill;
  variant?: Variant;
}) {
  const cover = kill.media.find((a) => a.id === kill.coverMediaId);
  const coverStyle = cover?.kind === 'photo'
    ? { backgroundImage: `url(${cover.downloadUrl})` }
    : undefined;
  const cal = weaponLabel(kill);
  const date = formatDate(kill.date);

  if (variant === 'overlay') {
    return (
      <Link to={`/portfolio/kills/${kill.id}`} className="kill-card kill-card-overlay">
        <div className="kill-cover-img" style={coverStyle}>
          <span className="weapon-badge">{cal}</span>
          <div className="kill-card-copy">
            <strong>{kill.species}</strong>
            <span>{kill.location.placeName} · {date}</span>
          </div>
        </div>
      </Link>
    );
  }

  if (variant === 'grid') {
    return (
      <Link to={`/portfolio/kills/${kill.id}`} className="kill-card kill-card-grid">
        <div className="kill-cover-img" style={coverStyle}>
          <span className="weapon-badge weapon-badge-sm">{cal}</span>
          <div className="kill-card-copy">
            <strong>{kill.species}</strong>
            <span>{date}</span>
          </div>
        </div>
      </Link>
    );
  }

  if (variant === 'compact') {
    return (
      <Link to={`/portfolio/kills/${kill.id}`} className="kill-card kill-card-compact">
        <div className="kill-thumb" style={coverStyle} />
        <div className="kill-card-compact-body">
          <strong>{kill.species}</strong>
          <span>{kill.location.placeName} · {date}</span>
        </div>
        <span className="compact-cal">{cal}</span>
        <span className="compact-chevron" aria-hidden="true" />
      </Link>
    );
  }

  /* below */
  return (
    <Link to={`/portfolio/kills/${kill.id}`} className="kill-card kill-card-below">
      <div className="kill-cover-img kill-cover-img-below" style={coverStyle} />
      <div className="kill-card-below-body">
        <div>
          <strong>{kill.species}</strong>
          <span>{kill.location.placeName} · {date}</span>
        </div>
        <span className="weapon-badge-tint">{cal}</span>
      </div>
    </Link>
  );
}
```

**CSS additions for card variants (add to globals.css):**

```css
/* Shared card base */
.kill-card {
  display: block;
  border-radius: 16px;
  overflow: hidden;
  text-decoration: none;
  box-shadow: 0 2px 10px rgba(0,0,0,0.08);
  background: var(--cover-bg);
  transition: transform 180ms ease;
}
.kill-card:active { transform: scale(0.97); }

/* Cover image shared */
.kill-cover-img {
  position: relative;
  width: 100%;
  background: var(--cover-bg) center/cover no-repeat;
}

/* Overlay variant */
.kill-card-overlay .kill-cover-img {
  height: 300px;
  background-image: linear-gradient(to top, rgba(0,0,0,0.62) 0%, rgba(0,0,0,0.18) 38%, rgba(0,0,0,0) 62%);
}
.kill-card-overlay .kill-cover-img::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(0,0,0,0.62) 0%, rgba(0,0,0,0.18) 38%, rgba(0,0,0,0) 62%);
  pointer-events: none;
}
.kill-card-overlay .kill-card-copy {
  position: absolute;
  left: 16px; right: 16px; bottom: 15px;
}
.kill-card-overlay .kill-card-copy strong {
  display: block;
  font-size: 22px;
  font-weight: 700;
  letter-spacing: -0.3px;
  color: #fff;
  text-shadow: 0 1px 8px rgba(0,0,0,0.35);
}
.kill-card-overlay .kill-card-copy span {
  display: block;
  margin-top: 3px;
  font-size: 13.5px;
  font-weight: 500;
  color: rgba(255,255,255,0.92);
  text-shadow: 0 1px 6px rgba(0,0,0,0.4);
}

/* Grid variant */
.kill-card-grid .kill-cover-img {
  height: 158px;
}
.kill-card-grid .kill-cover-img::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.1) 45%, transparent 65%);
  pointer-events: none;
}
.kill-card-grid .kill-card-copy {
  position: absolute;
  left: 11px; right: 11px; bottom: 10px;
}
.kill-card-grid .kill-card-copy strong {
  display: block;
  font-size: 14.5px;
  font-weight: 700;
  letter-spacing: -0.2px;
  color: #fff;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.kill-card-grid .kill-card-copy span {
  display: block;
  margin-top: 1px;
  font-size: 11px;
  font-weight: 500;
  color: rgba(255,255,255,0.9);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}

/* Compact variant */
.kill-card-compact {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 9px 14px 9px 11px;
  background: var(--card-bg);
  border-radius: 0;
}
.kill-thumb {
  flex: none;
  width: 60px; height: 60px;
  border-radius: 11px;
  background: var(--cover-bg) center/cover no-repeat;
}
.kill-card-compact-body {
  flex: 1; min-width: 0;
}
.kill-card-compact-body strong {
  display: block;
  font-size: 16px; font-weight: 600;
  letter-spacing: -0.1px;
  color: var(--text);
}
.kill-card-compact-body span {
  display: block;
  margin-top: 2px;
  font-size: 13px; color: var(--muted);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.compact-cal {
  flex: none;
  font-size: 11px; font-weight: 600;
  color: var(--accent-tint-text);
  font-family: 'SF Mono', ui-monospace, monospace;
}
.compact-chevron {
  flex: none;
  width: 8px; height: 8px;
  border-right: 2px solid var(--muted);
  border-bottom: 2px solid var(--muted);
  transform: rotate(-45deg);
  margin-left: 2px;
}

/* Below variant */
.kill-card-below { background: var(--card-bg); }
.kill-cover-img-below { height: 230px; }
.kill-card-below-body {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
  padding: 13px 15px 15px;
}
.kill-card-below-body strong {
  display: block;
  font-size: 18px; font-weight: 700;
  letter-spacing: -0.2px; color: var(--text);
}
.kill-card-below-body span {
  display: block;
  margin-top: 3px;
  font-size: 13.5px; color: var(--muted);
}

/* Weapon badges */
.weapon-badge {
  position: absolute;
  top: 14px; right: 14px;
  display: flex; align-items: center;
  padding: 5px 10px;
  border-radius: 20px;
  background: rgba(255,255,255,0.18);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  box-shadow: inset 0 0 0 0.5px rgba(255,255,255,0.4);
  font-size: 11px; font-weight: 600; letter-spacing: 0.4px;
  color: #fff;
  font-family: 'SF Mono', ui-monospace, monospace;
}
.weapon-badge-sm {
  top: 9px; right: 9px;
  padding: 3px 7px;
  border-radius: 14px;
  font-size: 9.5px;
}
.weapon-badge-tint {
  flex: none;
  margin-top: 2px;
  display: inline-flex; align-items: center;
  padding: 4px 9px;
  border-radius: 7px;
  background: var(--accent-tint-bg);
  font-size: 11px; font-weight: 600;
  letter-spacing: 0.3px;
  color: var(--accent-tint-text);
  font-family: 'SF Mono', ui-monospace, monospace;
}
```

---

## 5. BottomNav — 5 tabs

**File:** `components/portfolio/bottom-nav.tsx`

Replace entirely. The tab bar matches the design exactly: Feed, Leaders, + (FAB), Map, Profile.

```tsx
import { Link, useLocation } from 'react-router-dom';

export function BottomNav() {
  const { pathname } = useLocation();
  const active = (path: string) => pathname === path || pathname.startsWith(path + '/');

  return (
    <nav className="bottom-nav" aria-label="Primary navigation">
      {/* Feed */}
      <Link to="/portfolio" className={`tab-item ${active('/portfolio') && !active('/portfolio/leaderboard') && !active('/portfolio/armory') ? 'tab-active' : ''}`}>
        <FeedIcon />
        <span>Feed</span>
      </Link>

      {/* Leaderboard */}
      <Link to="/portfolio/leaderboard" className={`tab-item ${active('/portfolio/leaderboard') ? 'tab-active' : ''}`}>
        <LeaderboardIcon />
        <span>Leaders</span>
      </Link>

      {/* Center FAB */}
      <Link to="/portfolio/kills/new" className="tab-fab" aria-label="Log a kill">
        <span className="tab-fab-inner" aria-hidden="true">
          <span className="fab-plus-h" />
          <span className="fab-plus-v" />
        </span>
      </Link>

      {/* Map */}
      <Link to="/portfolio/map" className={`tab-item ${active('/portfolio/map') ? 'tab-active' : ''}`}>
        <MapIcon />
        <span>Map</span>
      </Link>

      {/* Profile */}
      <Link to="/portfolio/profile" className={`tab-item ${active('/portfolio/profile') || active('/portfolio/armory') ? 'tab-active' : ''}`}>
        <ProfileIcon />
        <span>Profile</span>
      </Link>
    </nav>
  );
}

function FeedIcon() {
  return (
    <div className="tab-icon" aria-hidden="true">
      <span className="feed-roof" />
      <span className="feed-body" />
    </div>
  );
}
function LeaderboardIcon() {
  return (
    <div className="tab-icon" aria-hidden="true" style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 20 }}>
      <span style={{ width: 5, height: 11, background: 'currentColor', borderRadius: '2px 2px 0 0' }} />
      <span style={{ width: 5, height: 19, background: 'currentColor', borderRadius: '2px 2px 0 0' }} />
      <span style={{ width: 5, height: 15, background: 'currentColor', borderRadius: '2px 2px 0 0' }} />
    </div>
  );
}
function MapIcon() {
  return (
    <div className="tab-icon" aria-hidden="true">
      <span className="map-pin" />
    </div>
  );
}
function ProfileIcon() {
  return (
    <div className="tab-icon" aria-hidden="true">
      <span className="profile-head" />
      <span className="profile-shoulders" />
    </div>
  );
}
```

**CSS for BottomNav (replace old `.bottom-nav` rules in globals.css):**

```css
.bottom-nav {
  position: fixed;
  z-index: 20;
  left: 0; right: 0; bottom: 0;
  height: 84px;
  display: flex;
  align-items: flex-start;
  justify-content: space-around;
  padding-top: 10px;
  background: var(--frost);
  backdrop-filter: blur(22px) saturate(180%);
  -webkit-backdrop-filter: blur(22px) saturate(180%);
  border-top: 0.5px solid var(--sep);
}

.tab-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  width: 62px;
  color: var(--tab-idle);
  font-size: 10px;
  font-weight: 500;
  text-decoration: none;
  transition: color 150ms ease;
}
.tab-item.tab-active { color: var(--accent); font-weight: 600; }

.tab-icon {
  position: relative;
  width: 23px; height: 20px;
  display: flex; align-items: center; justify-content: center;
}

/* Feed icon (house shape) */
.feed-roof {
  position: absolute; top: 0; left: 50%;
  transform: translateX(-50%);
  width: 0; height: 0;
  border-left: 12px solid transparent;
  border-right: 12px solid transparent;
  border-bottom: 9px solid currentColor;
}
.feed-body {
  position: absolute; bottom: 0; left: 50%;
  transform: translateX(-50%);
  width: 15px; height: 11px;
  background: currentColor;
  border-radius: 0 0 2px 2px;
}

/* Map pin icon */
.map-pin {
  display: flex; align-items: center; justify-content: center;
  width: 15px; height: 15px;
  border-radius: 50% 50% 50% 0;
  background: currentColor;
  transform: rotate(-45deg);
}
.map-pin::after {
  content: '';
  width: 5px; height: 5px;
  border-radius: 50%;
  background: var(--page-bg);
  transform: rotate(45deg);
}

/* Profile icon */
.profile-head {
  position: absolute; top: 0; left: 50%;
  transform: translateX(-50%);
  width: 9px; height: 9px;
  border-radius: 50%;
  background: currentColor;
}
.profile-shoulders {
  position: absolute; bottom: 0; left: 50%;
  transform: translateX(-50%);
  width: 17px; height: 11px;
  border-radius: 9px 9px 3px 3px;
  background: currentColor;
}

/* Center FAB */
.tab-fab {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: -4px;
  text-decoration: none;
}
.tab-fab-inner {
  position: relative;
  width: 52px; height: 52px;
  border-radius: 50%;
  background: var(--accent-btn);
  box-shadow: 0 6px 16px var(--accent-shadow);
  display: flex; align-items: center; justify-content: center;
}
.fab-plus-h {
  position: absolute; top: 50%; left: 0; right: 0;
  height: 2.5px; margin-top: -1.25px;
  background: #fff; border-radius: 2px;
}
.fab-plus-v {
  position: absolute; left: 50%; top: 0; bottom: 0;
  width: 2.5px; margin-left: -1.25px;
  background: #fff; border-radius: 2px;
}
```

---

## 6. Portfolio Shell — mobile-first

**File:** `src/styles/globals.css` — update `.portfolio-shell`

The portfolio shell now fills the screen with bottom padding for the tab bar.

```css
.portfolio-shell {
  min-height: 100svh;
  padding-top: 0;
  padding-bottom: 84px;           /* tab bar height */
  background: var(--page-bg);
  overflow-x: hidden;
}

.portfolio-content {
  width: 100%;
  max-width: 100%;
  margin: 0;
  padding: 0;
}
```

The profile content becomes a full-bleed scrollable column. Desktop breakpoint can restore the wide layout if desired, but the base is mobile.

---

## 7. ProfileHeader — update to match FeedScreen design

**File:** `components/portfolio/profile-header.tsx`

Update to match the design: avatar left + name/bio inline, then stats row with separators, then segmented control.

```tsx
export function ProfileHeader({ profile, stats, activeTab, onTabChange }: {
  profile: Profile;
  stats: PortfolioStats;
  activeTab: 'feed' | 'location' | 'armory';
  onTabChange: (tab: 'feed' | 'location' | 'armory') => void;
}) {
  return (
    <div className="profile-section">
      <div className="profile-identity-row">
        {profile.avatarUrl ? (
          <span className="ios-avatar" style={{ backgroundImage: `url(${profile.avatarUrl})` }} />
        ) : (
          <span className="ios-avatar ios-avatar-initials">{initials(profile.displayName)}</span>
        )}
        <div className="profile-name-block">
          <div className="ios-name">{profile.displayName}</div>
          {profile.bio && <div className="ios-bio-inline">{profile.bio}</div>}
        </div>
        <div className="ios-more-btn" aria-label="More options">
          <span /><span /><span />
        </div>
      </div>
      {profile.bio && <p className="ios-bio">{profile.bio}</p>}
      <div className="ios-stats">
        <div><span className="ios-stat-num">{stats.animals}</span><span className="ios-stat-label">Animals</span></div>
        <div className="ios-stat-sep" />
        <div><span className="ios-stat-num">{stats.countries}</span><span className="ios-stat-label">Countries</span></div>
        <div className="ios-stat-sep" />
        <div>
          <span className="ios-stat-num">{stats.distanceKm}<span className="ios-stat-unit"> km</span></span>
          <span className="ios-stat-label">Walked</span>
        </div>
      </div>
      <div className="ios-seg">
        {(['feed', 'location', 'armory'] as const).map((tab) => (
          <button
            key={tab}
            className={`ios-seg-btn${activeTab === tab ? ' ios-seg-active' : ''}`}
            onClick={() => onTabChange(tab)}
          >
            {tab === 'feed' ? 'Feed' : tab === 'location' ? 'By Location' : 'Armory'}
          </button>
        ))}
      </div>
    </div>
  );
}
```

**CSS (add to globals.css):**
```css
.profile-section { padding: 64px 20px 0; }
.profile-identity-row {
  display: flex; align-items: center; gap: 16px;
}
.ios-avatar {
  flex: none;
  display: block; width: 74px; height: 74px;
  border-radius: 50%;
  background: var(--accent-btn) center/cover no-repeat;
  box-shadow: 0 1px 4px rgba(0,0,0,0.12);
}
.ios-avatar-initials {
  display: grid; place-items: center;
  color: #fff;
  font-size: 28px; font-weight: 700;
  background: linear-gradient(145deg, #789079, #1f3d2b);
}
.profile-name-block { flex: 1; min-width: 0; }
.ios-name {
  font-size: 24px; font-weight: 700;
  letter-spacing: -0.5px; color: var(--text);
}
.ios-bio-inline { /* hidden, bio shown separately below */ display: none; }
.ios-bio {
  margin: 13px 0 0;
  font-size: 14.5px; line-height: 1.42; color: var(--body);
}
.ios-more-btn {
  flex: none;
  width: 34px; height: 34px; border-radius: 50%;
  background: var(--seg-track);
  display: flex; align-items: center; justify-content: center; gap: 2.5px;
  cursor: pointer;
}
.ios-more-btn span {
  width: 3.5px; height: 3.5px; border-radius: 50%;
  background: var(--muted);
}
.ios-stats {
  margin-top: 18px;
  display: flex; align-items: center;
}
.ios-stats > div { display: flex; flex-direction: column; }
.ios-stat-num {
  font-size: 21px; font-weight: 700;
  letter-spacing: -0.3px; color: var(--text);
}
.ios-stat-unit { font-size: 13px; font-weight: 600; color: var(--muted); }
.ios-stat-label {
  margin-top: 1px; font-size: 12.5px; color: var(--muted);
}
.ios-stat-sep {
  width: 1px; height: 30px;
  background: var(--sep); margin: 0 20px;
}
.ios-seg {
  margin-top: 18px;
  display: flex; padding: 2px;
  background: var(--seg-track); border-radius: 9px;
}
.ios-seg-btn {
  flex: 1; text-align: center;
  padding: 6px 0; border: 0; border-radius: 7px;
  cursor: pointer;
  font-size: 13px; font-weight: 500; color: var(--muted);
  background: transparent; transition: all 150ms ease;
}
.ios-seg-btn.ios-seg-active {
  background: var(--seg-active-bg);
  box-shadow: var(--seg-shadow);
  font-weight: 600; color: var(--seg-active-text);
}
```

---

## 8. New Page: Armory (`/portfolio/armory`)

**Create:** `src/pages/armory-page.tsx`

This is a profile sub-page accessible via the Armory tab in the profile segmented control. It can also be a section rendered inline in `portfolio-page.tsx` when the Armory tab is selected — either approach works as long as the URL stays clean.

**Preferred approach:** render ArmoryScreen inside the portfolio shell when `activeTab === 'armory'`, no separate route needed (avoids router complexity). Alternatively add route `/portfolio/armory` — either is fine.

**Create:** `components/portfolio/armory-view.tsx`

```tsx
'use client' is not needed — this is Vite.

export function ArmoryView() {
  return (
    <div className="armory-view">
      {/* GEAR LIBRARY */}
      {GEAR_SECTIONS.map((sec) => (
        <div key={sec.label} className="gear-section">
          <div className="gear-section-header">
            <span className="mono-label">{sec.label}</span>
            <span className="gear-count accent">{sec.count}</span>
          </div>
          <div className="gear-grid">
            {sec.items.map((item) => (
              <div key={item.name} className="gear-card">
                <div className="gear-card-img" />
                <div className="gear-card-body">
                  <div className="gear-card-name">{item.name}</div>
                  <div className="gear-card-spec">{item.spec}</div>
                </div>
              </div>
            ))}
            <button className="gear-add-slot" aria-label={`Add ${sec.addLabel}`}>
              <span className="gear-add-icon" aria-hidden="true" />
              <span>Add {sec.addLabel}</span>
            </button>
          </div>
        </div>
      ))}

      {/* LOADOUTS */}
      <div className="loadouts-section">
        <div className="loadouts-header">
          <span className="mono-label">LOADOUTS</span>
          <button className="accent-link">New loadout</button>
        </div>
        <p className="loadouts-hint">Saved combinations of weapon, optic & ammo.</p>
        <div className="loadouts-list">
          {SAMPLE_LOADOUTS.map((lo) => (
            <LoadoutCard key={lo.name} loadout={lo} />
          ))}
        </div>
      </div>
      <div style={{ height: 40 }} />
    </div>
  );
}
```

**`LoadoutCard` sub-component** (same file or separate):

```tsx
function LoadoutCard({ loadout }: { loadout: Loadout }) {
  return (
    <div className="loadout-card">
      <div className="loadout-head">
        <span className="loadout-crest">{loadout.tag}</span>
        <div className="loadout-title-block">
          <span className="loadout-name">{loadout.name}</span>
          <span className="loadout-use">{loadout.use}</span>
        </div>
        {loadout.isDefault && (
          <span className="default-badge">
            <span className="default-dot" />DEFAULT
          </span>
        )}
      </div>
      <div className="loadout-rows">
        {loadout.rows.map((r) => (
          <div key={r.k} className="loadout-row">
            <span className="loadout-row-key">{r.k}</span>
            <span className="loadout-row-val">{r.v}</span>
            <span className="loadout-row-spec">{r.s}</span>
          </div>
        ))}
      </div>
      <div className="loadout-actions">
        <button className="loadout-btn">Edit</button>
        <button className="loadout-btn loadout-btn-outline">
          {loadout.isDefault ? 'Default' : 'Set default'}
        </button>
      </div>
    </div>
  );
}
```

**CSS (add to globals.css):**

```css
/* Gear sections */
.armory-view { padding: 22px 16px 0; }
.gear-section { margin-bottom: 22px; }
.gear-section-header {
  display: flex; align-items: baseline;
  justify-content: space-between;
  margin-bottom: 11px;
}
.mono-label {
  font-size: 12px; font-weight: 700;
  letter-spacing: 0.7px; color: var(--muted);
  font-family: 'SF Mono', ui-monospace, monospace;
}
.gear-count { font-size: 12.5px; font-weight: 500; }
.accent { color: var(--accent); }
.gear-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
.gear-card {
  border-radius: 15px; overflow: hidden;
  background: var(--card-bg);
  box-shadow: 0 2px 10px rgba(0,0,0,0.08);
}
.gear-card-img {
  width: 100%; height: 92px;
  background: var(--cover-bg);
}
.gear-card-body { padding: 10px 12px 12px; }
.gear-card-name {
  font-size: 14.5px; font-weight: 600;
  letter-spacing: -0.2px; color: var(--text);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.gear-card-spec {
  margin-top: 3px;
  font-size: 11px; font-weight: 500; color: var(--muted);
  font-family: 'SF Mono', ui-monospace, monospace;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.gear-add-slot {
  border-radius: 15px;
  border: 1.5px dashed var(--dashed);
  background: transparent;
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  gap: 7px; min-height: 148px; cursor: pointer;
  font-size: 12px; font-weight: 500; color: var(--muted);
}
.gear-add-icon {
  position: relative; width: 20px; height: 20px;
  display: block;
}
.gear-add-icon::before, .gear-add-icon::after {
  content: ''; position: absolute;
  background: var(--muted); border-radius: 2px;
}
.gear-add-icon::before { top: 50%; left: 0; right: 0; height: 2px; margin-top: -1px; }
.gear-add-icon::after { left: 50%; top: 0; bottom: 0; width: 2px; margin-left: -1px; }

/* Loadouts */
.loadouts-section { margin-top: 30px; }
.loadouts-header {
  display: flex; align-items: baseline;
  justify-content: space-between; margin-bottom: 6px;
}
.accent-link {
  border: 0; background: transparent; cursor: pointer;
  font-size: 12.5px; font-weight: 500; color: var(--accent);
}
.loadouts-hint { font-size: 13px; color: var(--muted); margin: 0 0 13px; }
.loadouts-list { display: flex; flex-direction: column; gap: 13px; }

/* Loadout card — always dark */
.loadout-card {
  border-radius: 17px; overflow: hidden;
  background: var(--loadout-bg);
  box-shadow: 0 4px 16px var(--loadout-shadow);
  border: 0.5px solid var(--loadout-border);
}
.loadout-head {
  padding: 15px 16px 13px;
  background: var(--loadout-head);
  display: flex; align-items: center; gap: 9px;
}
.loadout-crest {
  flex: none; width: 30px; height: 30px; border-radius: 9px;
  background: var(--crest-bg);
  display: flex; align-items: center; justify-content: center;
  font-size: 13px; font-weight: 700;
  color: var(--crest-text);
  font-family: 'SF Mono', ui-monospace, monospace;
}
.loadout-title-block { flex: 1; min-width: 0; }
.loadout-name {
  display: block;
  font-size: 17px; font-weight: 700;
  letter-spacing: -0.3px; color: var(--loadout-text);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.loadout-use {
  display: block;
  font-size: 11.5px; font-weight: 500;
  color: var(--loadout-muted);
  font-family: 'SF Mono', ui-monospace, monospace;
}
.default-badge {
  flex: none; display: inline-flex; align-items: center; gap: 4px;
  padding: 4px 9px; border-radius: 13px;
  background: var(--def-bg);
  font-size: 10px; font-weight: 700; letter-spacing: 0.4px;
  color: var(--def-text);
  font-family: 'SF Mono', ui-monospace, monospace;
}
.default-dot {
  width: 5px; height: 5px; border-radius: 50%;
  background: var(--def-dot);
}
.loadout-rows { padding: 4px 16px 6px; }
.loadout-row {
  display: flex; align-items: center; gap: 12px;
  padding: 9px 0;
  border-bottom: 0.5px solid var(--loadout-sep);
}
.loadout-row:last-child { border-bottom: none; }
.loadout-row-key {
  flex: none; width: 54px;
  font-size: 9.5px; font-weight: 700; letter-spacing: 0.6px;
  color: var(--loadout-muted);
  font-family: 'SF Mono', ui-monospace, monospace;
}
.loadout-row-val {
  flex: 1; min-width: 0;
  font-size: 14px; font-weight: 600; color: var(--loadout-text);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.loadout-row-spec {
  flex: none; font-size: 11px; font-weight: 500;
  color: var(--loadout-muted);
  font-family: 'SF Mono', ui-monospace, monospace;
}
.loadout-actions {
  display: flex; gap: 9px;
  padding: 11px 16px 15px;
}
.loadout-btn {
  flex: 1; text-align: center;
  padding: 9px 0; border-radius: 10px; border: 0;
  background: var(--loadout-btn);
  font-size: 13px; font-weight: 600;
  color: var(--loadout-btn-text); cursor: pointer;
}
.loadout-btn-outline {
  background: transparent;
  border: 1px solid var(--set-def-border);
  color: rgba(255,255,255,0.92);
}
```

---

## 9. New Page: Leaderboard (`/portfolio/leaderboard`)

**Create:** `src/pages/leaderboard-page.tsx`  
**Create:** `components/portfolio/leaderboard-view.tsx`

```tsx
const SPECIES = ['Greater Kudu', 'Red Stag', 'Gemsbok', 'Mule Deer', 'Roe Deer', 'Elk'];

export function LeaderboardView() {
  const [activeSpecies, setActiveSpecies] = useState(SPECIES[0]);

  return (
    <div className="lb-view">
      {/* Header */}
      <div className="lb-header">
        <span className="lb-season">GLOBAL · 2025 SEASON</span>
        <h1 className="lb-title">Leaderboard</h1>
      </div>

      {/* Species pills */}
      <div className="lb-species-scroll">
        {SPECIES.map((s) => (
          <button
            key={s}
            className={`lb-species-pill${s === activeSpecies ? ' lb-species-active' : ''}`}
            onClick={() => setActiveSpecies(s)}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Ranked-by note */}
      <div className="lb-ranked-row">
        <span className="lb-ranked-species">{activeSpecies}</span>
        <span className="lb-ranked-by">RANKED BY SCI SCORE</span>
      </div>

      {/* Podium */}
      <div className="lb-podium">
        {/* 2nd */}
        <div className="lb-podium-item">
          <div className="lb-podium-avatar" />
          <div className="lb-podium-handle">@hendrik_k</div>
          <div className="lb-podium-score accent">54 ⅛</div>
          <div className="lb-podium-block lb-silver">
            <span>2</span>
          </div>
        </div>
        {/* 1st */}
        <div className="lb-podium-item lb-podium-first">
          <span className="lb-crown">♛</span>
          <div className="lb-podium-avatar lb-avatar-gold" />
          <div className="lb-podium-handle">@willem_pj</div>
          <div className="lb-podium-score lb-podium-score-lg accent">56 ⅞</div>
          <div className="lb-podium-block lb-gold">
            <span>1</span>
          </div>
        </div>
        {/* 3rd */}
        <div className="lb-podium-item">
          <div className="lb-podium-avatar lb-avatar-sm" />
          <div className="lb-podium-handle">@marcus_h</div>
          <div className="lb-podium-score accent">53 ⅜</div>
          <div className="lb-podium-block lb-bronze">
            <span>3</span>
          </div>
        </div>
      </div>

      {/* Ranked list */}
      <div className="lb-list-wrap">
        <div className="lb-list">
          {SAMPLE_ROWS.map((r) => (
            <div key={r.rank} className={`lb-row${r.isYou ? ' lb-row-you' : ''}`}>
              <span className={`lb-rank mono${r.isYou ? ' accent' : ''}`}>{r.rank}</span>
              <div className="lb-row-avatar" />
              <div className="lb-row-info">
                <div className="lb-row-handle">{r.handle}</div>
                <div className="lb-row-place">{r.place}</div>
              </div>
              <div className="lb-row-thumb" />
              <span className="lb-row-score mono accent">{r.score}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{ height: 104 }} />
    </div>
  );
}
```

**CSS (add to globals.css):**

```css
.lb-view { padding: 0; }
.lb-header { padding: 60px 16px 0; }
.lb-season {
  font-size: 12px; font-weight: 600; letter-spacing: 0.5px;
  color: var(--muted);
  font-family: 'SF Mono', ui-monospace, monospace;
}
.lb-title {
  margin: 0;
  font-size: 28px; font-weight: 700;
  letter-spacing: -0.6px; color: var(--text); line-height: 1.05;
}
.lb-species-scroll {
  margin-top: 16px;
  display: flex; gap: 8px;
  overflow-x: auto; padding: 0 16px 2px;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}
.lb-species-scroll::-webkit-scrollbar { display: none; }
.lb-species-pill {
  flex: none;
  padding: 8px 14px; border-radius: 20px; border: 0;
  background: var(--input-bg);
  border: 1px solid var(--input-border);
  font-size: 13px; font-weight: 600;
  color: var(--body); cursor: pointer;
  white-space: nowrap;
  transition: all 150ms ease;
}
.lb-species-pill.lb-species-active {
  background: var(--accent-btn);
  border-color: transparent;
  color: #fff;
}
.lb-ranked-row {
  padding: 16px 16px 0;
  display: flex; align-items: center; justify-content: space-between;
}
.lb-ranked-species { font-size: 13px; font-weight: 600; color: var(--text); }
.lb-ranked-by {
  font-size: 11.5px; font-weight: 600; letter-spacing: 0.4px;
  color: var(--muted);
  font-family: 'SF Mono', ui-monospace, monospace;
}

/* Podium */
.lb-podium {
  padding: 18px 16px 0;
  display: flex; align-items: flex-end;
  justify-content: center; gap: 10px;
}
.lb-podium-item {
  flex: 1; display: flex; flex-direction: column; align-items: center;
}
.lb-podium-first { /* 1st place item is taller via block height */ }
.lb-crown { font-size: 18px; line-height: 1; margin-bottom: 4px; color: #d4a53a; }
.lb-podium-avatar {
  width: 58px; height: 58px; border-radius: 50%;
  background: var(--cover-bg);
  box-shadow: 0 2px 8px rgba(0,0,0,0.18);
}
.lb-avatar-gold {
  width: 72px; height: 72px;
  box-shadow: 0 0 0 3px #d4a53a, 0 4px 12px rgba(0,0,0,0.22);
}
.lb-avatar-sm { width: 54px; height: 54px; }
.lb-podium-handle {
  margin-top: 8px;
  font-size: 13px; font-weight: 700; color: var(--text);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  max-width: 96px;
}
.lb-podium-score {
  font-size: 12px; font-weight: 600;
  font-family: 'SF Mono', ui-monospace, monospace;
}
.lb-podium-score-lg { font-size: 13px; font-weight: 700; }
.lb-podium-block {
  margin-top: 8px; width: 100%;
  border-radius: 13px 13px 0 0;
  display: flex; align-items: flex-start;
  justify-content: center; padding-top: 9px;
}
.lb-podium-block span { font-family: 'SF Mono', ui-monospace, monospace; font-weight: 800; }
.lb-gold {
  height: 88px; border-radius: 14px 14px 0 0;
  background: linear-gradient(180deg, #f2d98c 0%, #e5c45f 100%);
  box-shadow: 0 -2px 14px rgba(212,165,58,0.35);
}
.lb-gold span { font-size: 26px; color: #7a5e11; }
.lb-silver { height: 60px; background: #e4e4e9; }
.lb-silver span { font-size: 20px; color: #7a7a82; }
.lb-bronze { height: 44px; background: #e8d6c4; }
.lb-bronze span { font-size: 18px; color: #8a5e33; }
@media (prefers-color-scheme: dark) {
  .lb-gold { background: linear-gradient(180deg,#3a2f14 0%,#241c0c 100%); }
  .lb-gold span { color: #e5c45f; }
  .lb-silver { background: #26262a; }
  .lb-silver span { color: #a8a8b0; }
  .lb-bronze { background: #2a211a; }
  .lb-bronze span { color: #c49a6c; }
}

/* Ranked list */
.lb-list-wrap { padding: 18px 16px 0; }
.lb-list {
  border-radius: 16px; overflow: hidden;
  background: var(--card-bg);
  box-shadow: 0 2px 10px rgba(0,0,0,0.08);
}
.lb-row {
  display: flex; align-items: center; gap: 12px;
  padding: 11px 14px;
  border-bottom: 0.5px solid var(--sep);
}
.lb-row:last-child { border-bottom: none; }
.lb-row-you { background: rgba(31,61,43,0.05); }
@media (prefers-color-scheme: dark) {
  .lb-row-you { background: rgba(46,125,79,0.14); }
}
.lb-rank {
  flex: none; width: 22px; text-align: center;
  font-size: 15px; font-weight: 700; color: var(--muted);
}
.lb-row-avatar {
  flex: none; width: 38px; height: 38px;
  border-radius: 50%; background: var(--cover-bg);
}
.lb-row-info { flex: 1; min-width: 0; }
.lb-row-handle {
  font-size: 14.5px; font-weight: 600; color: var(--text);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.lb-row-place {
  margin-top: 1px;
  font-size: 12px; color: var(--muted);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.lb-row-thumb {
  flex: none; width: 42px; height: 42px;
  border-radius: 9px; background: var(--cover-bg);
}
.lb-row-score {
  flex: none;
  font-size: 13px; font-weight: 700;
  min-width: 46px; text-align: right;
}
.mono { font-family: 'SF Mono', ui-monospace, monospace; }
```

---

## 10. Router Changes

**File:** `src/router.tsx`

Add two new routes inside the `private` children array:

```tsx
{
  id: 'leaderboard',
  path: '/portfolio/leaderboard',
  element: <LeaderboardPage />,
},
{
  id: 'armory',
  path: '/portfolio/armory',
  element: <ArmoryPage />,
},
```

Create `src/pages/leaderboard-page.tsx`:
```tsx
import { LeaderboardView } from '@/components/portfolio/leaderboard-view';
import { BottomNav } from '@/components/portfolio/bottom-nav';

export function LeaderboardPage() {
  return (
    <div className="portfolio-shell">
      <LeaderboardView />
      <BottomNav />
    </div>
  );
}
```

Create `src/pages/armory-page.tsx`:
```tsx
import { ArmoryView } from '@/components/portfolio/armory-view';
import { BottomNav } from '@/components/portfolio/bottom-nav';

export function ArmoryPage() {
  return (
    <div className="portfolio-shell">
      <ArmoryView />
      <BottomNav />
    </div>
  );
}
```

---

## 11. Input / Unit styles

Add to `globals.css`:

```css
.input-with-unit {
  display: flex; height: 44px;
  border-radius: 11px; overflow: hidden;
  background: var(--input-bg);
  border: 1px solid var(--input-border);
}
.input-with-unit input {
  flex: 1; border: 0; background: transparent;
  padding: 0 12px;
  font-size: 15px; font-weight: 500; color: var(--text);
  outline: none;
}
.unit-select, .unit-label {
  flex: none; width: 60px;
  display: flex; align-items: center; justify-content: center;
  background: var(--unit-bg);
  border-left: 1px solid var(--input-border);
  font-size: 13px; font-weight: 600; color: var(--muted);
  font-family: 'SF Mono', ui-monospace, monospace;
}
.unit-select { border: 0; cursor: pointer; }
.section-hint {
  margin: -8px 0 12px;
  font-size: 12px; color: var(--muted);
}
```

---

## 12. Firestore Security Rules

`farmName` is added to `killLocationSchema` as required. Existing `firestore.rules` validates only `ownerId` path matching and auth. No rule changes needed for the new fields — Zod validates them on write, Firestore rules guard auth boundary. If rules include field-level validation, add `farmName` to the location map validation.

---

## 13. Test updates

**`tests/components/kill-form.test.tsx`** — add `farmName` to any form submission mocks.  
**`tests/rules/firestore.rules.test.ts`** — ensure kill create/update tests include `farmName` in location.  
**`tests/app/page.test.tsx`** — update snapshot if any.

---

## 14. Implementation order

1. `lib/domain/kill.ts` — add `farmName`, `measurementSchema` ✓
2. `lib/domain/kill-edit.ts` — expose `measurement` ✓
3. `components/kills/types.ts` — add fields to `KillFormSubmission` ✓
4. `components/kills/kill-form.tsx` — add `EditorFields`, measurements section ✓
5. `components/kills/location-fields.tsx` — add `farmName` required field ✓
6. `src/styles/globals.css` — replace/extend with all new CSS ✓
7. `components/portfolio/kill-card.tsx` — 4-variant rewrite ✓
8. `components/portfolio/bottom-nav.tsx` — 5-tab rewrite ✓
9. `components/portfolio/profile-header.tsx` — iOS-style update ✓
10. `components/portfolio/armory-view.tsx` — new file ✓
11. `components/portfolio/leaderboard-view.tsx` — new file ✓
12. `src/pages/armory-page.tsx` — new page ✓
13. `src/pages/leaderboard-page.tsx` — new page ✓
14. `src/router.tsx` — add routes ✓
15. Run `npm run typecheck && npm run lint && npm run build` ✓
16. Fix any type errors (most likely: `farmName` missing in existing kill fixtures in tests) ✓
