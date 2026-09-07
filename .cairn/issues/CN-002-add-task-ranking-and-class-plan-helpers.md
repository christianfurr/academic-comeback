---
id: CN-002
title: Add task ranking and class plan helpers
status: closed
priority: 1
type: feature
feature: 2026-09-06-academic-game-plan
blocked_by:
files: [src/lib/classMath.ts, src/lib/planMath.ts]
acceptance: Pure helpers produce deterministic plan items for missing assignments and custom tasks, including empty, completed, undated, and target-reached cases.
assignee: Christian Furr
created: 2026-09-06
closed: 2026-09-06
---

Reuse assignmentImpact and existing grade calculations. Keep imported assignment items derived rather than duplicated in state.

## Notes

- 2026-09-06 Added derived class-plan ranking for missing assignments and custom tasks, with deterministic due-date and completion ordering.
