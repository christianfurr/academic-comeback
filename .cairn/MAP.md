---
verified_at_sha: 64f5fa1
verified_at: 2026-09-06
---

# What this repo is
Calcu is an authenticated academic recovery planner branded Comeback / Protocol. Students import or enter classes and assignments, calculate current and projected grades, set targets, and use what-if scores to understand the work needed to reach them.
The app keeps a local planner snapshot, optionally mirrors it to Convex, and imports Skyward grades through a Convex Node action before merging them through a review flow.

# Entry points
- `README.md` — product summary, stack, and local startup.
- `src/app/page.tsx` — authenticated app shell, planner state wiring, and top-level flows.
- `src/hooks/usePlannerState.ts` — localStorage hydration plus debounced Convex sync.
- `src/components/ClassDetail.tsx` — class dashboard, target grade, what-if sliders, and editable assignments.
- `src/lib/grademath.ts` — current, projected, and needed-grade calculations.
- `src/lib/parser.ts` — pasted portal and generic grade parsing.
- `src/hooks/useSkywardSync.ts` — client-side Skyward merge and removal review.
- `convex/schema.ts` — planner state and encrypted Skyward credential tables.

# Where things live
- Product UI: `src/components/`; copy the dense editable patterns from `ClassDetail.tsx` and the modal patterns from `SyncClassModal.tsx`.
- App state: `src/hooks/` and `src/lib/plannerSerialize.ts`; `usePlannerState.ts` is the closest persistence example.
- Domain model: `src/lib/types.ts`, `src/lib/classMath.ts`, and `src/lib/grademath.ts`.
- Backend: `convex/`; public planner queries/mutations live in `plannerStates.ts`, while Skyward secrets and actions are split between `skywardData.ts` and `skyward.ts`.
- Styling: `src/app/globals.css` plus Tailwind utilities; existing CSS variables define parchment, paper, midnight, accent, density, and typography choices.

# How data moves
`src/app/page.tsx` owns the class list, active class, view, and visual tweaks through `usePlannerState`. The hook hydrates localStorage first, then reads `api.plannerStates.get` when authenticated and cloud sync is enabled; edits save locally immediately and to Convex after an 800ms debounce. Grade import produces `ParsedCourse[]`, which `normalize.ts` converts into `ClassData`; Skyward results pass through `useSkywardSync.ts` and `syncClass.ts` so stale removals require review. Convex functions derive identity from Clerk auth, validate arguments with `convex/values`, and return explicit errors or sync results.

# Commands
- `bun dev` — Next development server.
- `bun run build` — production build.
- `bun start` — serve the production build.
- `bun run lint` — ESLint.
- No test command is defined. Dependencies must be installed before commands can run.

# Gotchas
- `convex/_generated/ai/guidelines.md` is required reading before Convex edits.
- Planner state is one serialized blob in `plannerStates.stateJson`; new planner features must preserve `AppState` serialization and versioning.
- `src/app/page.tsx` only renders the planner after both Clerk and local preferences hydrate, so new top-level surfaces need loading and signed-out behavior.
- Skyward credentials are encrypted in `convex/skyward.ts`; do not expose plaintext or move decryption into the browser.
- The current Convex lookups use `identity.subject`; the Convex guidelines prefer `identity.tokenIdentifier` for canonical auth-linked keys, so changing identity storage would be a separate migration decision.
- The current checkout lacks `node_modules`; `bun run lint` and `bun run build` cannot verify until dependencies are installed.
