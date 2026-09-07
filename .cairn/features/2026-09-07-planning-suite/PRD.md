# Planning Suite

Extend the class game plan into a daily action system without adding reminders, AI, or a second data store. Students should see what matters today, estimate effort, track assignment progress, compare realistic score scenarios, review progress over time, plan across classes, and prepare factual teacher conversations.

## Acceptance

A signed-in student can switch between class, today, and semester views; see open work ranked by grade impact, due date, status, and effort; update work status; compare uniform-score scenarios; review a compact progress history; and copy a teacher conversation checklist. Existing local and Convex planner persistence continues to work.

## Scope boundary

Included: Today view, task effort, assignment status, score scenarios, progress snapshots, semester rollup, teacher checklist.

Excluded: push notifications, calendar integration, recurring tasks, AI-generated advice, GPA history, and external teacher messaging.

## Approach

Keep one serialized planner snapshot. Add small optional fields with fallbacks so older state remains readable. Derive daily and semester lists from classes, tasks, and assignment status instead of creating a second assignment store. Use the existing class math for impact and projections.

## Verification

`bunx tsc --noEmit`, `bun run lint`, `bun run build`, `git diff --check`, `cairn check`, and local browser checks at 390px and 1440px. Vercel preview must pass before merge.
