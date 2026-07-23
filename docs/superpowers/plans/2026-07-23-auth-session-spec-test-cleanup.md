# Auth Session Spec Test Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the auth-session tests reviewable by separating unit and provider-integration responsibilities, removing three E2E-duplicated provider cases, and expressing remaining session timelines with named helpers.

**Architecture:** Keep production code unchanged. Split activity and synchronization tests into direct-unit and `AuthProvider` integration specs, with a small synchronization test-support module for shared typed messages, sessions, Storage events, and `BroadcastChannel` control. Preserve distinct race coverage and let the focused E2E suite own positive browser activity flows.

**Tech Stack:** TypeScript, React, Vitest, JSDOM, Playwright

## Global Constraints

- Modify test files only; do not change production behavior.
- Keep `sessionActivity.spec.ts` free of `AuthProvider`, React rendering, and application-service mocks.
- Keep `sessionSync.spec.ts` free of `AuthProvider` and React rendering.
- Retain provider race coverage for token replacement, rejected requests, returned-token checkpoints, deferred request ordering, logout settlement, and unmount cleanup.
- Remove provider activity cases already proven by focused E2E coverage: positive pre-window checkpoint refresh, focus inside the refresh window, and repeated mousemove deduplication.
- Keep assertions and important event ordering visible in each test.
- Replace unexplained timer arithmetic with named duration constants and timeline helpers.
- Do not build a broad shared test framework or hide assertions inside helpers.
- Keep the focused cross-tab E2E cases unchanged.
- Restore `test/auth/payload-types.ts` and `tsconfig.base.json` after E2E runs.
- Do not touch `/private/tmp/payload-activity-aware-auth-3x`; its backport remains deferred.

---

## File Map

- Modify `packages/ui/src/providers/Auth/sessionActivity.spec.ts`
  - Keep five direct tracker/listener unit tests only.
- Create `packages/ui/src/providers/Auth/AuthProvider.sessionActivity.spec.ts`
  - Hold six provider checkpoint, token, failure, and cleanup integration tests.
- Modify `packages/ui/src/providers/Auth/sessionSync.spec.ts`
  - Keep twelve direct synchronization-coordinator tests only.
- Create `packages/ui/src/providers/Auth/AuthProvider.sessionSync.spec.ts`
  - Hold fourteen provider request, remote-session, expiration, logout, and cleanup integration tests.
- Create `packages/ui/src/providers/Auth/sessionSync.test.ts`
  - Share typed sync messages, sessions, Storage notifications, and the mock `BroadcastChannel` between the two sync specs.

Expected final focused inventory: 37 tests total.

---

### Task 1: Separate direct activity units from provider integration

**Files:**

- Modify: `packages/ui/src/providers/Auth/sessionActivity.spec.ts`
- Create: `packages/ui/src/providers/Auth/AuthProvider.sessionActivity.spec.ts`

**Interfaces:**

- `sessionActivity.spec.ts` consumes only `createSessionActivityTracker`, `registerSessionActivityListeners`, and `sessionActivityThrottleMs`.
- `AuthProvider.sessionActivity.spec.ts` renders `AuthProvider` and observes requests/timers through the existing test harness.
- No production exports or signatures change.

- [ ] **Step 1: Record the existing activity baseline**

Run:

```bash
mise exec node@24.15.0 -- pnpm vitest run --project unit packages/ui/src/providers/Auth/sessionActivity.spec.ts
```

Expected: one file and fourteen tests pass.

- [ ] **Step 2: Reduce `sessionActivity.spec.ts` to direct units**

Keep the existing three `createSessionActivityTracker` tests and two `registerSessionActivityListeners` tests. Its import and setup shape should become:

```ts
import { describe, expect, it, vi } from 'vitest'

import {
  createSessionActivityTracker,
  registerSessionActivityListeners,
  sessionActivityThrottleMs,
} from './sessionActivity.js'
```

Keep `createWindow()` in this file. Remove:

```ts
React
act
createRoot
AuthContext
UserWithToken
AuthProvider
useAuth
all vi.mock(...) application dependencies
renderedContainer
renderedRoot
authContext
renderAuthenticatedProvider
CaptureAuthContext
createFutureSession
```

- [ ] **Step 3: Create the provider activity spec**

Create `AuthProvider.sessionActivity.spec.ts` with the existing JSDOM directive, React/provider imports, mocks, cleanup, render harness, and these named constants:

```ts
const fiveMinuteTokenMs = 300_000
const tenMinuteTokenMs = 600_000
const refreshWindowMs = 120_000
const refreshDebounceMs = 1_000
```

Add small time/event helpers:

```ts
async function advanceSessionBy(milliseconds: number): Promise<void> {
  await act(async () => vi.advanceTimersByTimeAsync(milliseconds))
}

function dispatchMousemove(): void {
  window.dispatchEvent(new MouseEvent('mousemove'))
}

async function advancePastRefreshDebounce(): Promise<void> {
  await advanceSessionBy(refreshDebounceMs)
}
```

Helpers may move time or dispatch setup events, but assertions remain in the tests.

- [ ] **Step 4: Move the six provider-only cases**

Move the current bodies without changing their assertions, then rename them as follows and replace combined time literals with the Step 3 helpers:

| Current test name                                                                    | Final test name                                                            |
| ------------------------------------------------------------------------------------ | -------------------------------------------------------------------------- |
| `should not refresh at the checkpoint for activity older than the refresh window`    | `should ignore activity older than the refresh window at the checkpoint`   |
| `should cancel a pending checkpoint refresh when a new token is accepted`            | `should cancel a queued checkpoint refresh when a local token is accepted` |
| `should retry an activity refresh after a rejected request and later activity`       | `should allow later activity to retry after a rejected refresh`            |
| `should schedule a usable checkpoint for a token returned by a successful refresh`   | `should schedule the next checkpoint for a refreshed token`                |
| `should not recreate session timers when an activity refresh resolves after unmount` | `should ignore an activity refresh response that resolves after unmount`   |
| `should clear the pending checkpoint on provider unmount`                            | `should cancel a pending activity checkpoint on unmount`                   |

Do not move these three provider tests:

```text
should refresh at the checkpoint for activity exactly one refresh window earlier
should refresh when activity occurs after an empty checkpoint
should refresh for activity at the start of the refresh window after an empty checkpoint
```

Their positive user-visible behavior is owned by `test/auth/e2e.spec.ts`.

- [ ] **Step 5: Run the split activity specs**

Run:

```bash
mise exec node@24.15.0 -- pnpm vitest run --project unit \
  packages/ui/src/providers/Auth/sessionActivity.spec.ts \
  packages/ui/src/providers/Auth/AuthProvider.sessionActivity.spec.ts
```

Expected: two files and eleven tests pass.

- [ ] **Step 6: Verify responsibility boundaries**

Run:

```bash
rg -n "AuthProvider|createRoot|requests: apiMocks|vi\\.useFakeTimers" \
  packages/ui/src/providers/Auth/sessionActivity.spec.ts
```

Expected: no matches.

Run:

```bash
rg -n "358_998|181_001|61_001|1_001" \
  packages/ui/src/providers/Auth/AuthProvider.sessionActivity.spec.ts
```

Expected: no unexplained combined-duration literals. Use named constants and separate time movements.

- [ ] **Step 7: Format and commit**

Run:

```bash
mise exec node@24.15.0 -- pnpm prettier --check \
  packages/ui/src/providers/Auth/sessionActivity.spec.ts \
  packages/ui/src/providers/Auth/AuthProvider.sessionActivity.spec.ts
git diff --check
```

Commit:

```bash
git add \
  packages/ui/src/providers/Auth/sessionActivity.spec.ts \
  packages/ui/src/providers/Auth/AuthProvider.sessionActivity.spec.ts
mise exec node@24.15.0 -- git commit -m "test(ui): separate session activity specs"
```

---

### Task 2: Separate synchronization coordinator units from provider integration

**Files:**

- Modify: `packages/ui/src/providers/Auth/sessionSync.spec.ts`
- Create: `packages/ui/src/providers/Auth/AuthProvider.sessionSync.spec.ts`
- Create: `packages/ui/src/providers/Auth/sessionSync.test.ts`

**Interfaces:**

- `sessionSync.test.ts` produces typed test data and transport control:

```ts
createSession({ expirationMs, token? }): UserWithToken
createFutureSession({ expiresInMs, token }): UserWithToken
createMessage(message): AuthSessionSyncMessage
dispatchStorageRefresh(notification): void
getBroadcastChannel(): MockBroadcastChannel
resetMockBroadcastChannels(): void
MockBroadcastChannel
```

- `sessionSync.spec.ts` directly exercises `createAuthSessionSync`.
- `AuthProvider.sessionSync.spec.ts` renders `AuthProvider` and uses the same test-support transport objects.

- [ ] **Step 1: Record the existing synchronization baseline**

Run:

```bash
mise exec node@24.15.0 -- pnpm vitest run --project unit packages/ui/src/providers/Auth/sessionSync.spec.ts
```

Expected: one file and twenty-six tests pass.

- [ ] **Step 2: Create focused synchronization test support**

Create `sessionSync.test.ts`. Move the existing typed implementations for session/message creation and mock channel control into it. Keep the exported surface limited to:

```ts
export class MockBroadcastChannel {
  static instances: MockBroadcastChannel[] = []

  close = vi.fn()
  listeners = new Set<(event: MessageEvent<AuthSessionSyncMessage>) => void>()
  name: string
  postMessage = vi.fn()
  removeEventListener = vi.fn(
    (
      _type: string,
      listener: (event: MessageEvent<AuthSessionSyncMessage>) => void,
    ) => {
      this.listeners.delete(listener)
    },
  )
  addEventListener = vi.fn(
    (
      _type: string,
      listener: (event: MessageEvent<AuthSessionSyncMessage>) => void,
    ) => {
      this.listeners.add(listener)
    },
  )

  constructor(name: string) {
    this.name = name
    MockBroadcastChannel.instances.push(this)
  }

  emit(message: AuthSessionSyncMessage): void {
    for (const listener of this.listeners) {
      listener(new MessageEvent('message', { data: message }))
    }
  }
}

export function resetMockBroadcastChannels(): void {
  MockBroadcastChannel.instances.length = 0
  vi.stubGlobal('BroadcastChannel', MockBroadcastChannel)
}

export function getBroadcastChannel(): MockBroadcastChannel {
  const channel = MockBroadcastChannel.instances.at(-1)

  if (!channel) {
    throw new Error('Expected a BroadcastChannel instance')
  }

  return channel
}
```

Keep `dispatchStorageRefresh` free of React:

```ts
export function dispatchStorageRefresh(notification: {
  affectedExpirationMs: number
  sentAt: number
  settlesSentAt?: number
  sourceID: string
  type: AuthSessionSyncEventType
}): void {
  const message =
    notification.type === AUTH_SESSION_SYNC_EVENT_TYPES.LOGGED_OUT
      ? {
          ...notification,
          settlesSentAt: notification.settlesSentAt ?? notification.sentAt - 1,
        }
      : notification

  window.dispatchEvent(
    new StorageEvent('storage', {
      key: 'payload:auth-session:refresh',
      newValue: JSON.stringify(message),
    }),
  )
}
```

Provider callers wrap this helper in `act`; direct coordinator tests call it directly.

- [ ] **Step 3: Reduce `sessionSync.spec.ts` to coordinator units**

Keep these describe groups and their twelve tests:

```text
createAuthSessionSync publishing
createAuthSessionSync receiving
createAuthSessionSync storage fallback
createAuthSessionSync transport failures
createAuthSessionSync cleanup
```

Keep `createSync`, `dispatchStoredNotification`, and the `sessionSyncCleanups` registry local because they express coordinator-specific setup. Import sessions/messages/channel primitives from `sessionSync.test.ts`.

Remove all React/provider imports, application mocks, provider render state, and the entire `AuthProvider session synchronization` describe block.

- [ ] **Step 4: Create the provider synchronization spec**

Create `AuthProvider.sessionSync.spec.ts` with:

- the existing JSDOM directive;
- React, `AuthProvider`, and `useAuth`;
- existing application mocks;
- `apiMocks`, `routerMocks`, provider render state, and provider cleanup;
- imports from `sessionSync.test.ts`;
- the fourteen existing `AuthProvider session synchronization` tests.

Group the retained tests without changing their behavior:

- `AuthProvider refresh synchronization`
  - `should publish a refresh after refreshCookie succeeds`
  - `should publish a refresh after refreshCookieAsync succeeds`
  - `should coalesce refresh requests before successful responses can settle in reverse`
  - `should ignore a deferred refreshCookie success after remote expiration`
  - `should apply the later response from overlapping storage-triggered user requests`
  - `should flush a deferred refresh rejection after a queued user request confirms no user`
- `AuthProvider remote session synchronization`
  - `should apply a remote refresh without rebroadcasting it`
  - `should cancel a pending activity refresh when a remote token is accepted`
- `AuthProvider expiration and logout synchronization`
  - `should publish expiration when a refresh response rejects the session`
  - `should publish expiration when the force-logout timer expires`
  - `should publish explicit logout before the logout request settles`
  - `should resynchronize a settled remote logout after a local relogin`
  - `should restore the shared session when a remote logout does not clear its cookie`
- `AuthProvider session synchronization cleanup`
  - `should not commit or navigate for a Storage response after provider unmount`

Rename only when the new name more directly states the event and outcome. Do not merge tests that protect different response-order or settlement paths.

- [ ] **Step 5: Run the split synchronization specs**

Run:

```bash
mise exec node@24.15.0 -- pnpm vitest run --project unit \
  packages/ui/src/providers/Auth/sessionSync.spec.ts \
  packages/ui/src/providers/Auth/AuthProvider.sessionSync.spec.ts
```

Expected: two files and twenty-six tests pass.

- [ ] **Step 6: Verify responsibility boundaries**

Run:

```bash
rg -n "AuthProvider|createRoot|requests: apiMocks|routerMocks" \
  packages/ui/src/providers/Auth/sessionSync.spec.ts
```

Expected: no matches.

Run:

```bash
rg -n "^describe\\(" \
  packages/ui/src/providers/Auth/sessionSync.spec.ts \
  packages/ui/src/providers/Auth/AuthProvider.sessionSync.spec.ts
```

Expected: coordinator groups appear only in `sessionSync.spec.ts`; provider groups appear only in `AuthProvider.sessionSync.spec.ts`.

- [ ] **Step 7: Format and commit**

Run:

```bash
mise exec node@24.15.0 -- pnpm prettier --check \
  packages/ui/src/providers/Auth/sessionSync.spec.ts \
  packages/ui/src/providers/Auth/AuthProvider.sessionSync.spec.ts \
  packages/ui/src/providers/Auth/sessionSync.test.ts
git diff --check
```

Commit:

```bash
git add \
  packages/ui/src/providers/Auth/sessionSync.spec.ts \
  packages/ui/src/providers/Auth/AuthProvider.sessionSync.spec.ts \
  packages/ui/src/providers/Auth/sessionSync.test.ts
mise exec node@24.15.0 -- git commit -m "test(ui): separate session synchronization specs"
```

---

### Task 3: Verify the final inventory and coverage boundary

**Files:**

- Verify: `packages/ui/src/providers/Auth/sessionActivity.spec.ts`
- Verify: `packages/ui/src/providers/Auth/AuthProvider.sessionActivity.spec.ts`
- Verify: `packages/ui/src/providers/Auth/sessionSync.spec.ts`
- Verify: `packages/ui/src/providers/Auth/AuthProvider.sessionSync.spec.ts`
- Verify unchanged: `test/auth/e2e.spec.ts`

**Interfaces:**

- Produces no new code.
- Confirms the four-spec responsibility boundary and focused E2E ownership.

- [ ] **Step 1: Run all focused Auth specs together**

Run:

```bash
mise exec node@24.15.0 -- pnpm vitest run --project unit \
  packages/ui/src/providers/Auth/sessionActivity.spec.ts \
  packages/ui/src/providers/Auth/AuthProvider.sessionActivity.spec.ts \
  packages/ui/src/providers/Auth/sessionSync.spec.ts \
  packages/ui/src/providers/Auth/AuthProvider.sessionSync.spec.ts
```

Expected: four files and thirty-seven tests pass.

- [ ] **Step 2: Print and review the final inventory**

Run:

```bash
rg -n "^(describe|  it\\()" \
  packages/ui/src/providers/Auth/sessionActivity.spec.ts \
  packages/ui/src/providers/Auth/AuthProvider.sessionActivity.spec.ts \
  packages/ui/src/providers/Auth/sessionSync.spec.ts \
  packages/ui/src/providers/Auth/AuthProvider.sessionSync.spec.ts
```

Confirm:

- five activity units;
- six activity/provider integrations;
- twelve sync coordinator units;
- fourteen sync/provider integrations;
- every test states a distinct event and outcome.

- [ ] **Step 3: Run focused auth E2E coverage**

Run:

```bash
PORT=3104 mise exec node@24.15.0 -- pnpm test:e2e auth \
  --grep "session activity|session synchronization"
```

Expected: seven tests pass:

- three session-activity browser flows;
- four cross-tab synchronization flows.

If Chromium cannot launch in the workspace sandbox, rerun the identical command with approved host execution.

- [ ] **Step 4: Restore generated E2E files**

Restore only runner-generated changes:

```bash
git restore test/auth/payload-types.ts tsconfig.base.json
```

Then run:

```bash
git status --short
git diff --check
```

Expected: no generated-file changes and no whitespace errors.

- [ ] **Step 5: Confirm production files are untouched**

Run:

```bash
git diff --name-only 044730d15465235ac4d965f79494c165daa6352d..HEAD
```

Expected paths:

```text
packages/ui/src/providers/Auth/AuthProvider.sessionActivity.spec.ts
packages/ui/src/providers/Auth/AuthProvider.sessionSync.spec.ts
packages/ui/src/providers/Auth/sessionActivity.spec.ts
packages/ui/src/providers/Auth/sessionSync.spec.ts
packages/ui/src/providers/Auth/sessionSync.test.ts
```

No `index.tsx`, `sessionActivity.ts`, `sessionSync.ts`, or E2E source changes are allowed.

- [ ] **Step 6: Record the removed tests in the implementation report**

Record these three removals and their E2E replacements:

```text
Provider positive pre-window checkpoint -> E2E mousemove checkpoint case
Provider focus after empty checkpoint -> E2E focus-inside-window case
Provider exact refresh-window start -> covered by E2E checkpoint/focus timing plus retained race units
```

Also record final file/test counts and verification output. No commit is required when this task changes no files.
