# Auth Provider Session Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Preserve the activity-aware authentication behavior while reducing `Auth/index.tsx` to provider composition and moving concurrency, timing, and synchronization details behind focused typed interfaces.

**Architecture:** A non-React coordinator owns serialized auth requests, generations, refresh deduplication, deferred invalidation, and logout settlement. A timing hook owns token timers and activity checkpoints, while a synchronization hook owns `createAuthSessionSync` setup and publication. The provider retains React state, Payload HTTP requests, navigation, and context composition.

**Tech Stack:** TypeScript, React hooks, Vitest, Playwright, Payload UI utilities.

## Global Constraints

- Preserve the public `AuthContext` API.
- Preserve refresh, inactivity, logout, cross-tab, `BroadcastChannel`, and storage-fallback behavior.
- Preserve existing token lifetime, refresh-window, debounce, and activity-throttle semantics.
- Do not add configuration or dependencies.
- Keep new unit coverage small and centered on real coordinator/timing outcomes.
- Keep the five real-provider auth-session Playwright scenarios as the end-to-end contract.

---

## File Structure

- Create `packages/ui/src/providers/Auth/types.ts` for shared session response and context types.
- Create `packages/ui/src/providers/Auth/sessionRequestCoordinator.ts` for request ordering and logout settlement.
- Create `packages/ui/src/providers/Auth/sessionRequestCoordinator.spec.ts` for four concurrency outcomes.
- Create `packages/ui/src/providers/Auth/useSessionTiming.ts` for token timers, activity checkpoints, and listener lifecycle.
- Create `packages/ui/src/providers/Auth/useSessionTiming.spec.ts` for checkpoint and cleanup behavior.
- Create `packages/ui/src/providers/Auth/useSessionSync.ts` for React setup/cleanup around `createAuthSessionSync`.
- Modify `packages/ui/src/providers/Auth/sessionSync.ts` to import shared types without depending on `index.tsx`.
- Modify `packages/ui/src/providers/Auth/index.tsx` to compose the extracted units.

### Task 1: Shared Types and Request Coordinator

**Files:**

- Create: `packages/ui/src/providers/Auth/types.ts`
- Create: `packages/ui/src/providers/Auth/sessionRequestCoordinator.ts`
- Create: `packages/ui/src/providers/Auth/sessionRequestCoordinator.spec.ts`
- Modify: `packages/ui/src/providers/Auth/sessionSync.ts`
- Modify: `packages/ui/src/providers/Auth/index.tsx`

**Interfaces:**

- Produces:

```ts
export type UserWithToken<T = AuthenticatedUser> = {
  exp: number
  refreshedToken?: string
  token?: string
  user: T
}

export type AuthRequestContext = {
  canCommit: () => boolean
  deferInvalidation: (invalidate: () => void) => void
  hasQueuedRequest: () => boolean
}

export type AuthSessionRequestCoordinator = {
  advanceSession: () => void
  clearPendingInvalidation: () => void
  enqueue: <Result>(
    request: (
      context: Pick<AuthRequestContext, 'hasQueuedRequest'>,
    ) => Promise<Result>,
  ) => Promise<Result>
  isLogoutPending: () => boolean
  refresh: (
    request: (context: AuthRequestContext) => Promise<AuthenticatedUser | null>,
  ) => Promise<AuthenticatedUser | null>
  settleLogout: ({
    clearSession,
    request,
  }: {
    clearSession: () => void
    request: () => Promise<void>
  }) => Promise<void>
}

export function createAuthSessionRequestCoordinator(): AuthSessionRequestCoordinator
```

- `index.tsx` continues to re-export `AuthContext` and `UserWithToken` from their existing public module path.

- [ ] **Step 1: Write failing coordinator tests**

Add four tests using deferred promises rather than request mocks:

```ts
it('should serialize auth requests in enqueue order', async () => {
  const coordinator = createAuthSessionRequestCoordinator()
  const first = createDeferred<void>()
  const order: string[] = []

  const firstRequest = coordinator.enqueue(async () => {
    order.push('first:start')
    await first.promise
    order.push('first:end')
  })
  const secondRequest = coordinator.enqueue(async () => {
    order.push('second')
  })

  expect(order).toEqual([])
  await Promise.resolve()
  expect(order).toEqual(['first:start'])

  first.resolve()
  await Promise.all([firstRequest, secondRequest])
  expect(order).toEqual(['first:start', 'first:end', 'second'])
})

it('should share a refresh request within one session generation', async () => {
  const coordinator = createAuthSessionRequestCoordinator()
  const refresh = createDeferred<AuthenticatedUser | null>()
  let runs = 0
  const run = () =>
    coordinator.refresh(async () => {
      runs += 1
      return refresh.promise
    })

  const first = run()
  const second = run()
  expect(first).toBe(second)

  refresh.resolve(null)
  await Promise.all([first, second])
  expect(runs).toBe(1)
})

it('should settle a logout once and prevent refresh from committing', async () => {
  const coordinator = createAuthSessionRequestCoordinator()
  const logout = createDeferred<void>()
  let clears = 0
  let logoutRequests = 0

  const first = coordinator.settleLogout({
    clearSession: () => {
      clears += 1
      coordinator.advanceSession()
    },
    request: async () => {
      logoutRequests += 1
      await logout.promise
    },
  })
  const second = coordinator.settleLogout({
    clearSession: () => {
      clears += 1
    },
    request: async () => {
      logoutRequests += 1
    },
  })

  expect(first).toBe(second)
  expect(await coordinator.refresh(async () => null)).toBeNull()
  logout.resolve()
  await first
  expect({ clears, logoutRequests }).toEqual({ clears: 1, logoutRequests: 1 })
})

it('should discard a deferred invalidation after the session advances', async () => {
  const coordinator = createAuthSessionRequestCoordinator()
  let invalidations = 0

  const first = coordinator.refresh(async ({ deferInvalidation }) => {
    deferInvalidation(() => {
      invalidations += 1
    })
    return null
  })
  const second = coordinator.enqueue(async () => {
    coordinator.advanceSession()
  })

  await Promise.all([first, second])
  expect(invalidations).toBe(0)
})
```

- [ ] **Step 2: Run the coordinator test and verify RED**

Run:

```bash
pnpm vitest --run --project unit packages/ui/src/providers/Auth/sessionRequestCoordinator.spec.ts
```

Expected: FAIL because `sessionRequestCoordinator.ts` does not exist.

- [ ] **Step 3: Implement the minimal coordinator**

Implement the current queue algorithm behind the interface. `advanceSession()` increments a
generation and clears deferred invalidation. `refresh()` captures the generation, shares one active
promise per generation, and supplies `canCommit()`. `settleLogout()` sets the pending flag before
calling `clearSession()`, shares one settlement, serializes the server request, and always clears the
pending flag.

Move `UserWithToken` and `AuthContext` to `types.ts`, use `import type` from both implementation
files, and re-export both types from `index.tsx`.

- [ ] **Step 4: Run the coordinator and existing sync tests**

Run:

```bash
pnpm vitest --run --project unit \
  packages/ui/src/providers/Auth/sessionRequestCoordinator.spec.ts \
  packages/ui/src/providers/Auth/sessionSync.spec.ts
```

Expected: all coordinator and synchronization tests pass.

- [ ] **Step 5: Commit**

```bash
git add \
  packages/ui/src/providers/Auth/types.ts \
  packages/ui/src/providers/Auth/sessionRequestCoordinator.ts \
  packages/ui/src/providers/Auth/sessionRequestCoordinator.spec.ts \
  packages/ui/src/providers/Auth/sessionSync.ts \
  packages/ui/src/providers/Auth/index.tsx
git commit -m "refactor(ui): extract auth request coordinator"
```

### Task 2: Session Timing and Activity Lifecycle

**Files:**

- Create: `packages/ui/src/providers/Auth/useSessionTiming.ts`
- Create: `packages/ui/src/providers/Auth/useSessionTiming.spec.ts`
- Modify: `packages/ui/src/providers/Auth/index.tsx`
- Reuse: `packages/ui/src/providers/Auth/sessionActivity.ts`

**Interfaces:**

```ts
export type SessionTimingController = {
  applyExpiration: (expirationMs: number) => void
  clear: () => void
  getKnownExpirationMs: () => number | undefined
  refreshCookie: (forceRefresh?: boolean) => void
}

export function useSessionTiming({
  isAuthenticated,
  onActivityRefresh,
  onExpire,
  onReminder,
}: {
  isAuthenticated: boolean
  onActivityRefresh: () => void
  onExpire: (expirationMs: number) => void
  onReminder: () => void
}): SessionTimingController
```

- [ ] **Step 1: Write failing timing tests**

Use Vitest fake timers with the real activity tracker:

```ts
it('should refresh at the checkpoint when activity occurred in the refresh window', () => {
  const onActivityRefresh = vi.fn()
  const timing = renderSessionTiming({ onActivityRefresh })

  timing.applyExpiration(Date.now() + 300_000)
  vi.advanceTimersByTime(120_000)
  window.dispatchEvent(new MouseEvent('mousemove'))
  vi.advanceTimersByTime(60_000)
  vi.advanceTimersByTime(1_000)

  expect(onActivityRefresh).toHaveBeenCalledTimes(1)
})

it('should clear timers and listeners on logout', () => {
  const onActivityRefresh = vi.fn()
  const onExpire = vi.fn()
  const timing = renderSessionTiming({ onActivityRefresh, onExpire })

  timing.applyExpiration(Date.now() + 300_000)
  timing.clear()
  window.dispatchEvent(new MouseEvent('mousemove'))
  vi.advanceTimersByTime(300_000)

  expect(onActivityRefresh).not.toHaveBeenCalled()
  expect(onExpire).not.toHaveBeenCalled()
})
```

The test helper mounts a minimal component that calls `useSessionTiming` and exposes the returned
controller. It uses real DOM events and fake time; it does not intercept network requests.

- [ ] **Step 2: Run the timing test and verify RED**

Run:

```bash
pnpm vitest --run --project unit packages/ui/src/providers/Auth/useSessionTiming.spec.ts
```

Expected: FAIL because `useSessionTiming.ts` does not exist.

- [ ] **Step 3: Implement the timing hook**

Move the following refs and their behavior from `index.tsx` into the hook:

- refresh debounce timeout;
- reminder timeout;
- forced logout timeout;
- activity checkpoint timeout;
- last activity;
- current and greatest-known expiration;
- current refresh buffer.

Use `createSessionActivityTracker()` and `registerSessionActivityListeners()` unchanged. Install
listeners only while `isAuthenticated` is true. `applyExpiration()` must preserve:

```ts
const expiresInMs = Math.max(
  0,
  Math.min(expirationMs - Date.now(), maxTimeoutMs),
)
const forceLogoutBufferMs = Math.min(60_000, expiresInMs / 2)
const refreshWindowMs = forceLogoutBufferMs * 2
```

The reminder fires at `expiresInMs - forceLogoutBufferMs`, the checkpoint at
`expiresInMs - refreshWindowMs`, and expiration at `expiresInMs`. `refreshCookie()` preserves the
one-second debounce and only schedules within the refresh window unless forced.

- [ ] **Step 4: Run activity and timing tests**

Run:

```bash
pnpm vitest --run --project unit \
  packages/ui/src/providers/Auth/sessionActivity.spec.ts \
  packages/ui/src/providers/Auth/useSessionTiming.spec.ts
```

Expected: all activity and timing tests pass.

- [ ] **Step 5: Commit**

```bash
git add \
  packages/ui/src/providers/Auth/useSessionTiming.ts \
  packages/ui/src/providers/Auth/useSessionTiming.spec.ts \
  packages/ui/src/providers/Auth/index.tsx
git commit -m "refactor(ui): extract auth session timing"
```

### Task 3: React Synchronization Lifecycle

**Files:**

- Create: `packages/ui/src/providers/Auth/useSessionSync.ts`
- Modify: `packages/ui/src/providers/Auth/index.tsx`
- Reuse: `packages/ui/src/providers/Auth/sessionSync.ts`

**Interfaces:**

```ts
export type AuthSessionSyncController = {
  publish: (
    event: AuthSessionSyncEvent,
  ) => AuthSessionSyncPublication | undefined
  publishStorageRefresh: (publication: AuthSessionLogoutPublication) => void
}

export function useSessionSync(
  options: Omit<Parameters<typeof createAuthSessionSync>[0], 'sourceID'>,
): AuthSessionSyncController
```

Export `AuthSessionLogoutPublication` from `sessionSync.ts` so the wrapper does not duplicate the
union narrowing.

- [ ] **Step 1: Write the failing type/build integration**

Create `useSessionSync.ts` with the interface imports and update `index.tsx` imports to consume
`useSessionSync`. Before implementation, run:

```bash
pnpm exec tsc --noEmit --pretty false \
  --project packages/ui/tsconfig.json
```

Expected: FAIL because `useSessionSync` has no implementation/return value.

- [ ] **Step 2: Implement the hook**

Create the source ID once per mount, call `createAuthSessionSync()` in an effect, clean up the exact
instance on unmount, and return stable `publish()` and `publishStorageRefresh()` callbacks that
delegate to the current instance. Keep all event validation and transport ordering in
`sessionSync.ts`.

- [ ] **Step 3: Run synchronization tests and UI type check**

Run:

```bash
pnpm vitest --run --project unit packages/ui/src/providers/Auth/sessionSync.spec.ts
pnpm exec tsc --noEmit --pretty false --project packages/ui/tsconfig.json
```

Expected: synchronization tests and UI type check pass.

- [ ] **Step 4: Commit**

```bash
git add \
  packages/ui/src/providers/Auth/useSessionSync.ts \
  packages/ui/src/providers/Auth/sessionSync.ts \
  packages/ui/src/providers/Auth/index.tsx
git commit -m "refactor(ui): extract auth session sync lifecycle"
```

### Task 4: Reduce the Provider to Composition

**Files:**

- Modify: `packages/ui/src/providers/Auth/index.tsx`
- Modify if required by type exports: `packages/ui/src/providers/Auth/types.ts`

**Interfaces:**

- Consumes `createAuthSessionRequestCoordinator()`, `useSessionTiming()`, and `useSessionSync()`.
- Preserves every field and signature in `AuthContext`.

- [ ] **Step 1: Record the structural failure**

Run:

```bash
rg -n \
  "authRequestQueueRef|authRequestSequenceRef|pendingAuthInvalidationRef|refreshRequestRef|sessionGenerationRef|sessionSyncRef|activityCheckpointTimeoutRef|lastSessionActivityAtRef" \
  packages/ui/src/providers/Auth/index.tsx
```

Expected: matches are present before the provider reduction.

- [ ] **Step 2: Compose the extracted units**

Replace direct ref manipulation with coordinator and lifecycle operations:

- `setNewUser()` calls `coordinator.advanceSession()` and applies state.
- `refreshSession()` delegates deduplication, generation checks, and deferred invalidation to
  `coordinator.refresh()`.
- `settleExplicitLogout()` delegates to `coordinator.settleLogout()`.
- applying a user response calls `sessionTiming.applyExpiration(exp * 1000)`;
  clearing one calls `sessionTiming.clear()`.
- refresh, expiration, logout, and storage fallback publish through `useSessionSync()`.
- remote synchronization handlers continue to use the same state and navigation paths.

Keep `userRef` only as a current-state mirror needed by asynchronous callbacks. Remove queue,
generation, pending invalidation, refresh, logout-settlement, timer, and synchronization refs from
the provider.

- [ ] **Step 3: Verify the structural boundary**

Run the command from Step 1 again.

Expected: no matches.

Also run:

```bash
wc -l packages/ui/src/providers/Auth/index.tsx
```

Expected: materially below the current 737 lines, with request and lifecycle implementations absent
regardless of the exact line count.

- [ ] **Step 4: Run focused unit and real-provider E2E tests**

Run:

```bash
pnpm vitest --run --project unit \
  packages/ui/src/providers/Auth/sessionActivity.spec.ts \
  packages/ui/src/providers/Auth/sessionRequestCoordinator.spec.ts \
  packages/ui/src/providers/Auth/sessionSync.spec.ts \
  packages/ui/src/providers/Auth/useSessionTiming.spec.ts
pnpm test:e2e auth-session --workers=1
```

Expected: all focused unit tests and all five auth-session Playwright tests pass.

- [ ] **Step 5: Commit**

```bash
git add packages/ui/src/providers/Auth
git commit -m "refactor(ui): simplify auth provider session wiring"
```

### Task 5: Full Verification and Review

**Files:**

- Review all files changed by Tasks 1–4.

- [ ] **Step 1: Run general authentication E2Es**

```bash
pnpm test:e2e auth --workers=1
```

Expected: the general auth suite passes with only its existing skip.

- [ ] **Step 2: Run the test build**

```bash
pnpm build:tests
```

Expected: 39/39 tasks complete.

- [ ] **Step 3: Run lint, formatting, and diff checks**

```bash
pnpm exec eslint --flag v10_config_lookup_from_file \
  packages/ui/src/providers/Auth \
  test/auth-session
pnpm exec prettier --check \
  packages/ui/src/providers/Auth \
  docs/superpowers/specs/2026-07-27-auth-provider-session-refactor-design.md \
  docs/superpowers/plans/2026-07-27-auth-provider-session-refactor.md
git diff --check
```

Expected: no lint errors, no formatting failures, and no whitespace errors. Existing Playwright
retryability warnings are acceptable.

- [ ] **Step 4: Review the whole branch diff**

```bash
git diff --stat main...HEAD
git diff main...HEAD -- packages/ui/src/providers/Auth
git status --short
```

Confirm:

- the provider contains composition rather than hidden state-machine implementation;
- public exports remain compatible;
- event payloads remain discriminated unions;
- no unrelated files changed;
- generated test files are restored if test commands modified them.

- [ ] **Step 5: Commit any verification-only cleanup**

If review finds formatting or naming cleanup, apply only those changes, rerun the affected command,
and commit:

```bash
git add packages/ui/src/providers/Auth
git commit -m "chore(ui): finish auth provider refactor"
```
