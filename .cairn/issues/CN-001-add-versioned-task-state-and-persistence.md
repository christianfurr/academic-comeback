---
id: CN-001
title: Add versioned task state and persistence
status: closed
priority: 1
type: feature
feature: 2026-09-06-academic-game-plan
blocked_by:
files: [src/lib/types.ts, src/lib/plannerSerialize.ts, src/lib/storage.ts, src/hooks/usePlannerState.ts, convex/plannerStates.ts]
acceptance: Existing planner snapshots migrate without data loss, and custom task edits persist locally and through the existing debounced Convex sync and reset flow.
assignee: Christian Furr
created: 2026-09-06
closed: 2026-09-06
---

Implement the persisted custom-task portion of the Academic Game Plan PRD. Preserve AppState versioning and existing classes/tweaks.

## Notes

- 2026-09-06 Added tasks to the versioned AppState and wired localStorage, hydration, debounced Convex serialization, and reset behavior.
