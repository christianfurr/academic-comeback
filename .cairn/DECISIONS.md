# Decisions

Append-only, newest last. One dated line per decision a future session would
otherwise re-litigate. Not a changelog: git already has one.
## 2026-09-06

- Keep the first planning feature class-scoped: students need one glanceable action list tied to the existing grade path before semester calendars, reminders, or AI planning.
- Store planner to-dos inside the versioned planner snapshot so local persistence, Convex sync, reset, and existing import flows share one source of truth.
- Preserve the current editorial/dense UI system and use color for task status and grade urgency only.
