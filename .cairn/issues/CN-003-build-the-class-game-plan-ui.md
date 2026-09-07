---
id: CN-003
title: Build the class Game Plan UI
status: open
priority: 1
type: feature
feature: 2026-09-06-academic-game-plan
blocked_by: [CN-001, CN-002]
files: [src/components/ClassDetail.tsx, src/components/GamePlan.tsx, src/components/primitives/EditableText.tsx]
acceptance: The class view lets students view prioritized work, add/edit/delete/date/complete custom tasks, and jump from imported work to the existing what-if control at mobile and desktop widths.
assignee:
created: 2026-09-06
closed:
---

Follow the existing ClassDetail and modal patterns. Include loading, empty, completed, and error-aware states without adding a UI dependency.
