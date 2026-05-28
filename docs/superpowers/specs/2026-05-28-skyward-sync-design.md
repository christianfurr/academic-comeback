# Skyward Sync — Design

**Status:** approved 2026-05-28. Scope v1: classes + assignments. Architect to extend later (GPA, attendance, schedule, messages).

## Goal

Replace the "paste your portal HTML into a textbox" sync flow with a real Skyward import. User taps **Sync from Skyward** in the top bar; calcu logs into Skyward Family Access on their behalf, pulls every class and its current-term assignments, runs the existing diff/merge machinery, and applies the result.

## Non-goals (v1)

- GPA, attendance, schedule, messages — architect for, don't ship.
- Scheduled / cron-driven background sync.
- Multi-student / family accounts.
- Per-class refresh button — single "Sync all" action only.

The existing paste-based `SyncClassModal` flow stays as a fallback (other districts, broken parser, etc.).

## Architecture

```
┌─────────────── browser ──────────────┐    ┌── Convex Node action ──┐    ┌── Skyward ──┐
│ Sync from Skyward button             │    │ syncFromSkyward()      │    │             │
│   ↓                                  │    │   load creds → decrypt │    │ skyporthttp │
│ useSkywardSync()                     │ →  │   SkywardClient.login  │ →  │ sfgradebook │
│   action → ParsedCourse[]            │    │   getClasses()         │    │ httploader  │
│   diffClassFromParsed (existing)     │    │   getAssignments() × N │    │             │
│   apply auto + show confirm modal    │    │ return ParsedCourse[]  │    │             │
└──────────────────────────────────────┘    └────────────────────────┘    └─────────────┘
```

Pure TS port of the Python client at `~/Code/skyward/src/skyward/`. No native deps. Runs in Convex's Node runtime.

### New modules

```
src/lib/skyward/
  auth.ts             POST /skyporthttp.w → POST /sfhome01.w → SkywardSession
  client.ts           SkywardClient { login, getClasses, getAssignments }
  parsers/
    gradebook.ts      sfgradebook001.w → ClassMeta[]
    assignments.ts    httploader popup → ParsedCategory[]
  types.ts            internal types (ClassMeta, TermGrade)
  index.ts

convex/
  schema.ts           +skywardCredentials table
  skyward.ts          setCredentials, clearCredentials, hasCredentials, syncFromSkyward
  lib/
    crypto.ts         encryptString / decryptString (AES-256-GCM, SKYWARD_ENC_KEY)

src/components/
  SkywardConnectModal.tsx
  SkywardSyncResultModal.tsx

src/hooks/
  useSkywardSync.ts
```

HTML parsing uses **`linkedom`** (pure JS, fast, Convex-friendly).

## Credentials

### Storage

```ts
// convex/schema.ts
skywardCredentials: defineTable({
  userId: v.string(),
  usernameCiphertext: v.string(),
  passwordCiphertext: v.string(),
  iv: v.string(),               // 12-byte nonce, base64
  authTag: v.string(),          // 16-byte GCM auth tag, base64
  baseUrl: v.string(),          // plaintext — not secret
  updatedAt: v.number(),
}).index("by_userId", ["userId"]),
```

### Encryption

- Algorithm: AES-256-GCM via `node:crypto`.
- Key: `SKYWARD_ENC_KEY` env var, set via `npx convex env set SKYWARD_ENC_KEY <32-byte-base64>`.
- Per-record IV (12 bytes), auth tag stored alongside ciphertext.
- Username + password encrypted independently with separate IVs (cheap; avoids implying any relationship between fields).

### Convex API

| Function | Type | Returns | Notes |
|---|---|---|---|
| `setCredentials({ username, password, baseUrl? })` | mutation | `null` | Defaults `baseUrl` to Jordan SD if blank. Validates URL pattern. |
| `clearCredentials()` | mutation | `null` | Idempotent. |
| `hasCredentials()` | query | `{ connected: boolean, baseUrl: string \| null }` | **Never returns plaintext.** |
| `syncFromSkyward()` | action (`"use node"`) | `SyncResult` (below) | Decrypts only inside the action body. |

```ts
type SyncResult =
  | { ok: false; reason: "no-credentials" | "auth" | "network"; message?: string }
  | {
      ok: true;
      courses: ParsedCourse[];                                       // existing type
      classMeta: { name: string; currentTerm: string; letter: string | null; percent: number | null }[];
      errors: { className: string; message: string }[];
    };
```

## Sync data flow

1. Client calls `api.skyward.syncFromSkyward()`.
2. Action looks up `skywardCredentials` row for `ctx.auth.getUserIdentity().subject`. None → `{ ok: false, reason: "no-credentials" }`.
3. Decrypt → `SkywardClient.login({ baseUrl, username, password })`.
4. `getClasses()` returns classes + per-term grade rows. For each class, current term = latest non-empty letter row.
5. Bounded `Promise.all` (concurrency 4) over `getAssignments(class, currentTerm)`. Per-class failure → push into `errors[]`; successes → push into `courses[]` as `ParsedCourse`.
6. Return.

**Client-side, in `useSkywardSync`:**

```
result = await syncFromSkyward();
if (!result.ok) → surface error (re-auth prompt if reason === "auth").
draft = currentClasses;
unmatched = [];  // ParsedCourse not present in calcu
removals = [];   // [{ className, category?, assignment? }] for confirm
matched = [];    // { existingId, mergedAuto, hasRemovals }

for each ParsedCourse:
  find calcu ClassData where norm(name) ⊆ norm(parsed.name) or vice versa
  if no match → unmatched.push(parsed); continue
  diff = diffClassFromParsed(existing, parsed)
  apply diff.merged to draft (the "keep stale" merge)
  if hasRemovals(diff) → removals.push({ className, diff.removedCategories, diff.removedAssignments, mergedFull: diff.mergedFull })

if unmatched.length === 0 && removals.length === 0:
  setClasses(draft); toast("Synced N classes · M added · K updated")
else:
  open SkywardSyncResultModal({ draft, unmatched, removals, summary })
  on confirm: replace draft entries with mergedFull where user chose "remove", push selected unmatched as new classes
```

## UI

### Top bar

New primary button next to existing controls:

| State | Pill text | Disabled? | onClick |
|---|---|---|---|
| disconnected | "Connect Skyward" | no | open SkywardConnectModal |
| idle | "Sync from Skyward" | no | trigger sync |
| syncing | "Syncing…" (animated dot) | yes | — |
| error | "Sync failed · retry" | no | retry; if auth, open connect modal |

### `SkywardConnectModal`

Visual parity with existing `SyncClassModal` (same border, shadow, layout).

```
⟳ Connect Skyward
─────────────────────────────────────
We'll log into Skyward Family Access on your behalf to pull
your classes and assignments. Credentials are encrypted at rest.

Username           [____________________]
Password           [____________________]   (password input)

▸ Different district?
   Skyward base URL  [https://skystu.jordan.k12.ut.us/scripts/...]

                                  [Cancel]  [Connect →]
```

On submit: `setCredentials` → close → immediately fire `useSkywardSync`.

### `SkywardSyncResultModal` (opens only when confirmation needed)

```
Synced from Skyward · just now
─────────────────────────────────
4 classes updated · 12 added · 7 score updates

▸ Found in Skyward — add to tracker (2)
   [✓] AP CALCULUS BC      ·  Period 3 · Mr. Hardy
   [ ] WORLD GEO            ·  Period 5 · Ms. Lee

▸ Missing from Skyward (3 assignments)
   LANG ARTS · "Reflection #4"
   BIOLOGY    · "Lab Safety Quiz"
   ...
   ○ Keep them      ● Remove them

▸ Errors (1)
   CHEMISTRY · couldn't load assignments

                              [Cancel]   [Apply →]
```

### `SyncControl` dropdown — new Skyward section

Appended below the existing cloud-sync section (these are different concepts — never collapse them into one toggle).

```
Skyward
  Not connected                            ← when no creds
  [Connect Skyward]

— OR —

Skyward
  Connected · skystu.jordan.k12.ut.us
  [Disconnect Skyward]
```

## Error handling

| reason | UI |
|---|---|
| `no-credentials` | open SkywardConnectModal |
| `auth` | toast "Skyward rejected your login" + open connect modal pre-filled with old username |
| `network` | toast with retry button |
| per-class error in `errors[]` | listed inside result modal (or toast if no other reason to open it) |

No automatic retries inside the action. Fail loudly so we notice real Skyward HTML changes.

## Testing

- `src/lib/skyward/__tests__/` — parser tests with hand-built HTML fixtures (no real student data). Mirrors the Python `tests/` layout.
- Mock `fetch` in auth/client tests with the caret-delimited login blob.
- `vitest` (not yet installed in calcu — add as dev dep alongside this work).
- Skip vitest setup if it bloats the change — gate on user pushback.

## Future-proofing

`SkywardClient` exposes `getClasses` and `getAssignments` in v1. The class signature leaves room for `getAttendance`, `getSchedule`, `getMessages`, `getGpa` — each is one extra `_post` + parser file, no refactor required. `convex/skyward.ts` exports stay namespaced so adding more actions (e.g. `syncAttendance`) is purely additive.

## What does *not* change

- `plannerStates.stateJson` blob remains the only place grade data persists. Skyward action is a stateless adapter.
- `src/lib/syncClass.ts` (`diffClassFromParsed`) — reused unchanged.
- Existing `SyncClassModal` paste flow — left in place as a fallback.
- Cloud-sync pill (`SyncControl`) behavior — Skyward credentials live alongside it, but the existing `cloudActive` semantics are untouched.
