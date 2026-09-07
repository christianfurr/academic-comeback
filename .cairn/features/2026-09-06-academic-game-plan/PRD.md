# Academic Game Plan

The planner gains a class-level action plan that turns grade data into a short, editable checklist. A student should be able to see what remains, understand which work has the highest grade impact, add their own tasks, and mark progress without leaving the class dashboard.

## Brief

**Goal:** Add a class-level game-plan area with prioritized missing work, editable to-dos, due dates, status, and links to existing what-if grade controls.

**Acceptance:** A signed-in student can open a class, see a prioritized plan containing missing assignments and custom tasks, edit or add tasks with due dates, mark tasks complete, and use a missing-assignment item to reach its existing what-if control; the plan survives reload and cloud sync.

**Out of scope:** Semester calendar views, reminders or notifications, recurring tasks, teacher communication, GPA history, AI-generated plans, and changes to Skyward credential handling.

**Stack:** Next.js 16, React 19, TypeScript, Bun, Tailwind CSS v4, Clerk, Convex.

**Commands:** `bun run build`, `bun run lint`, no test script exists, `bun dev`.

**UI system:** Follow the existing custom CSS-variable and Tailwind system in `src/app/globals.css`. Use the current dense editorial planner patterns; no new UI dependency, font, palette, or motion system.

**Branch:** `feat/academic-game-plan`, cut from `master`.

**Fleet size:** Feature-sized. This environment has no Workflow runner available, so implementation and review will run in this task with the same staged boundaries.

## Repo map

See `.cairn/MAP.md`. The feature touches `src/lib/types.ts`, planner serialization/state, class math, the class dashboard, and Convex planner persistence.

## Approach

Add a versioned `PlanTask` collection to `AppState`, with a discriminator for imported missing assignments versus user-created tasks. Derive imported tasks from the current class assignments at render time so Skyward and paste sync continue to update assignment data without duplicating it; persist only custom task edits and completion state. This keeps the plan aligned with grade data and avoids a second assignment database.

The class dashboard gets a compact “Game plan” section above the detailed breakdown. It ranks missing assignments by existing `assignmentImpact`, places incomplete custom tasks alongside them by due date, and exposes explicit empty, loading, and completed states. Clicking an imported assignment scrolls to its existing what-if row rather than creating duplicate grade controls.

## Work items

### CN-001 — Add versioned task state and persistence

Files: `src/lib/types.ts`, `src/lib/plannerSerialize.ts`, `src/lib/storage.ts`, `src/hooks/usePlannerState.ts`, `convex/plannerStates.ts`.

Acceptance: Existing planner snapshots migrate to the new state shape without data loss; custom task edits and completion state save locally and through the existing debounced Convex path; reset clears tasks with the planner.

### CN-002 — Add task ranking and class plan domain helpers

Files: `src/lib/classMath.ts`, `src/lib/planMath.ts`.

Acceptance: Helpers produce stable, deterministic plan items for missing assignments and custom tasks, use existing grade-impact math, and handle no assignments, no due dates, completed tasks, and already-reached targets.

### CN-003 — Build the class Game Plan UI

Files: `src/components/ClassDetail.tsx`, `src/components/GamePlan.tsx`, `src/components/primitives/EditableText.tsx` only if required.

Acceptance: The class view shows prioritized imported work and custom tasks; students can add, edit, delete, complete, and date custom tasks; imported items link to their what-if controls; the surface has loading, empty, and completed states and works at 390px and 1440px.

### CN-004 — Review, cleanup, and verification

Files: touched feature files plus `.cairn/features/2026-09-06-academic-game-plan/REVIEW.md`.

Acceptance: The branch passes build, typecheck, lint, existing tests if present, Cairn validation, copy review, and responsive UI checks; confirmed findings are fixed or documented as waivers.

## Verification

Run `bun install` if dependencies are absent, then `bun run build` and `bun run lint`. Typecheck is included in the Next build; run `bunx tsc --noEmit` separately if the installed Next version does not expose type errors during build. Start `bun dev` and inspect the changed class surface at 390px and 1440px, including empty, populated, completed, and error/loading states.

## Out of scope

No notifications, calendar integration, semester-wide task rollups, AI recommendations, automatic due-date inference, or backend schema migration beyond the existing serialized planner blob.

## Risks

- Existing serialized state is versioned; migration must preserve older snapshots and existing tweak settings.
- Derived Skyward tasks must not create duplicate persisted assignments or disappear when a user marks them complete.
- The current planner state functions key users by `identity.subject`; this feature will preserve that behavior and leave identity migration separate.
- Large classes can make a plan noisy; cap visible priority output while keeping the full list accessible.
