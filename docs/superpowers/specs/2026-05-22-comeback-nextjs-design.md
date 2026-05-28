# Comeback / Protocol — Next.js App Design Spec

**Date:** 2026-05-22  
**Source:** `design_handoff_comeback_protocol/` (full pixel-perfect prototype)  
**Stack:** Next.js 15 App Router · TypeScript · Tailwind CSS · localStorage

---

## Overview

Port the Comeback / Protocol academic recovery planner from the vanilla HTML/React prototype into a production Next.js app. The prototype is the authoritative design reference — this spec defines how to translate it into the Next.js environment.

**Product tagline:** "Plan your academic comeback."  
**Core loop:** Paste grades → see projected grade → drag what-if sliders → know exactly what to score on remaining work.

---

## Architecture

### Stack

- **Next.js 15 App Router** — single route `/`, no server-side data fetching needed
- **TypeScript** — strict mode
- **Tailwind CSS** — utility classes, extended with design tokens as CSS variables
- **Google Fonts** — Instrument Serif, Inter Tight, JetBrains Mono (via `next/font/google`)
- **No external UI library** — all components are bespoke; the design is custom enough that Radix adds no value here
- **No backend** — pure client-side, localStorage persistence

### Data flow

```
App (useState)
  └─ localStorage (read on mount, write on every state change)
  └─ Hero → onParse(parsed courses) | onAddManual()
  └─ Dashboard
       └─ ClassesSummary (read-only aggregate stats)
       └─ ClassTabs → onSelect / onAdd
       └─ ClassDetail (active class)
            └─ StickyProjectedBar (IntersectionObserver)
            └─ ComebackHeader → onUpdate(cls) / onDelete()
            └─ ComebackPath → onUpdate(cls)
            └─ CategoriesSection → onUpdate(cls)
       └─ SemesterView (when view === 'semester')
  └─ AddClassModal → onAdd(newClasses[])
```

No global store. `App` owns all state; children receive `cls` + `onUpdate(updatedCls)`.

---

## TypeScript Types

Exact state shape from the prototype (Convex-ready: all IDs are plain strings):

```ts
type Assignment = {
  id: string;
  name: string;
  letter: string | null;
  date: string | null;          // "MM/DD/YY"
  score: number | null;         // null when missing
  total: number;
  missing: boolean;
  noCount: boolean;
  whatIf: number | null;        // 0–100, used in projected math
};

type Category = {
  id: string;
  name: string;
  weight: number;               // 0–100, should sum to 100
  assignments: Assignment[];
};

type ClassData = {
  id: string;
  name: string;
  target: number;               // 50–100
  categories: Category[];
};

type AppState = {
  version: number;
  classes: ClassData[];
  activeId: string | null;
  view: 'class' | 'semester';
};
```

`localStorage` key: `comeback-state-v2` — same as prototype for continuity.

---

## File Structure

```
app/
  layout.tsx          Root layout: font loading, CSS variable injection, html data-attrs
  page.tsx            App shell (all state lives here)
  globals.css         CSS custom properties, theme variants, base resets

lib/
  types.ts            TypeScript types (Assignment, Category, ClassData, AppState)
  parser.ts           Port of parser.js → typed parseGradeData()
  grademath.ts        Port of grade math: computeGrade, computeProjected, computeNeeded, etc.
  storage.ts          localStorage read/write with versioned migration
  samples.ts          Sample grade data strings (apush, calc, chem, combined)
  helpers.ts          uid(), clamp(), fmt(), fmtPts(), letterFor(), gradeTone()

components/
  primitives/
    GradePill.tsx
    Sparkline.tsx
    EditableText.tsx
    NumberInput.tsx
    StatusDot.tsx
    MiniBar.tsx
  Hero.tsx            Landing/paste view
  Topbar.tsx          Brand row + view switch + actions
  ClassesSummary.tsx  4-stat aggregate strip
  ClassTabs.tsx       Horizontal scroll tabs
  ClassDetail.tsx     Composes StickyProjectedBar + Header + Path + Categories
  StickyProjectedBar.tsx
  ComebackHeader.tsx  Trajectory row + verdict bar
  ComebackPath.tsx    Missing assignments + sliders (PathRow)
  CategoriesSection.tsx  Full editable breakdown (CategoryBlock + AssignmentRow)
  SemesterView.tsx    All-classes grid + priorities list (SemesterCard)
  AddClassModal.tsx   Modal: paste or blank
```

---

## Theming

CSS variables on `<html>` driven by `data-bg` and `data-accent` attributes.

**Default (shipped):** `data-bg="midnight"` + `data-accent="electric"`

```css
[data-bg="midnight"] {
  --bg: #0c0d12;
  --bg-deep: #060709;
  --card: #16171e;
  --card-2: #1d1f28;
  --ink: #f0ebe1;
  --ink-soft: #c2bdb0;
  --muted: #7c7669;
  --muted-soft: #4f4a42;
  --border: rgba(240,235,225,0.10);
  --border-strong: rgba(240,235,225,0.22);
  --rule: rgba(240,235,225,0.06);
  --ace: #5dc485; --solid: #7aa3f0; --risk: #e8b04a; --low: #ed8848; --danger: #ed6253;
}

[data-accent="electric"] {
  --accent: #5b8aff;
  --accent-hot: #7ba3ff;
}
```

The parchment + red theme variables are also defined (light mode alt).

---

## Key Implementation Notes

### Parser
Port `parser.js` verbatim to TypeScript. Two strategies in order:
1. Portal format (Skyward/PowerSchool `weighted at X%` pattern)
2. Generic format (`Category (40%)` headers + score/total columns)

Multi-course detection: weights summing to 100% (±0.6) marks a course boundary.

### Grade Math
- **Current grade**: `computeGrade(categories)` — missing counts as 0 against possible total
- **Projected grade**: `computeProjected(categories)` — missing contributes `(whatIf/100) * total`
- **Needed average**: `computeNeeded(categories, target)` — linear solve for uniform % across all missing that hits target

### Sticky Bar
IntersectionObserver on `.comeback-header` with `rootMargin: '-60px 0px 0px 0px'`. Transitions in via `transform: translateY(-100%) → translateY(0)` over 280ms.

### localStorage → Convex migration path
State shape is already Convex-ready:
- All entities have string `id` fields
- No functions in state
- Flat, serializable structure
- Migration path: replace `loadState/saveState` in `lib/storage.ts` with Convex `useQuery`/`useMutation` hooks

### Tweaks panel
Not shipped. Theme is hard-coded to midnight + electric blue. User setting for theme can be added later.

---

## Components Detail

### Hero
- Brand mark: 3 colored dots + "COMEBACK/PROTOCOL" + meta
- Headline: 3-line Instrument Serif display at `clamp(64px, 11vw, 168px)`
- Paste textarea with 4 L-shaped corner bracket decorations
- Parse button + Start blank + sample chips (apush, calc, chem, combined)
- 3-step explanation grid
- Privacy footer

### ComebackHeader
- Editable class name (inline click-to-edit)
- 5-column trajectory: `Right now → [if you score what-ifs →] → PROJECTED (hero) → [→ target] → Target`
- Projected: `clamp(96px, 13vw, 152px)` letter, percent delta, sparkline
- Target: letter presets (A+/A/A−/B+/B/B− at 100/93/90/87/83/80) + range slider 50–100
- Verdict bar: tag + prose + "X% average needed on remaining work" big number

### ComebackPath
- Sort: impact / category / date
- Preset bar: set all missing to 60/70/80/90/100% + "↑ N% (hits target)" + "⊘ 0%"
- PathRow: assignment name + impact bar → range slider with target tick → % output + "✓ got this"

### CategoriesSection
- Collapsible CategoryBlock: editable name, weight NumberInput, mini bar, contribution
- AssignmentRow: status dot toggle (missing ↔ graded), editable name, letter, earned/possible NumberInput, score %, badges, ∅ no-count toggle, delete

---

## Animations

| Element | Animation |
|---------|-----------|
| Sticky bar slide-in | `transform 280ms cubic-bezier(0.16, 1, 0.3, 1)` |
| Modal pop-in | `220ms cubic-bezier(0.16, 1, 0.3, 1)` — fade + 4px translate + 0.98 scale |
| Modal backdrop | `180ms ease-out` |
| Brand dot pulse | `2.4s ease-in-out infinite` — opacity + scale |
| Button hover | `150ms` transform + box-shadow |
| Bar fills | `300ms` width transition |

---

## Accessibility

- All `<input type="range">` are keyboard-navigable natively
- `EditableText` inputs need `focus-visible` styles and `aria-label`
- `NumberInput` needs `aria-label` from context
- Add `aria-live="polite"` on projected grade and verdict for screen-reader updates
- "Skip to projected grade" skip-link for keyboard users

---

## Out of Scope (this build)

- Tweaks panel (prototype-only debugging surface)
- Theme switcher UI (hard-coded midnight + electric)
- Sharing / URL state export
- Final-exam dedicated toggle
- Configurable grade scales per class
- Authentication / cloud sync (Convex layer is next phase)
