# Activity Checkpoint Session Refresh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remember recent window focus or mouse movement and refresh once when the token reaches its refresh checkpoint, without allowing mouse movement to generate repeated network requests.

**Architecture:** Keep the existing five-second leading activity throttle, but reduce browser inputs to `focus` and `mousemove`. `AuthProvider` stores the last accepted activity timestamp in a ref and owns a checkpoint timer scheduled at the start of the existing refresh window; recent activity forces one refresh through the existing debounce and serialized request path. Applying a new token clears activity and schedules the next checkpoint.

**Tech Stack:** React, TypeScript, Vitest, Playwright, BroadcastChannel, browser Storage events.

## Global Constraints

- Observe only `window.focus` and `window.mousemove` as session activity.
- Do not observe pathname, pointer, keyboard, input, wheel, or visibility activity.
- Record accepted activity no more than once every `5_000ms`.
- Do not update React state for individual activity events.
- Do not send a request for activity outside the refresh window.
- At the refresh checkpoint, refresh only when accepted activity occurred within the preceding refresh-window duration.
- After successful token application, clear remembered activity and schedule the next checkpoint.
- Preserve `AuthContext.refreshCookie`, `refreshCookieAsync`, `admin.autoRefresh`, request serialization, force logout, and cross-tab synchronization.
- Remove code and tests that only support the discarded activity signals.
- Apply the same product behavior to main and the existing `codex/activity-aware-auth-session-3.x` backport branch.

---

## File Map

- Modify `packages/ui/src/providers/Auth/sessionActivity.ts`
  - Narrow activity types and listener registration to focus and mouse movement.
- Modify `packages/ui/src/providers/Auth/sessionActivity.spec.ts`
  - Replace obsolete listener and pathname tests with focused listener and checkpoint integration coverage.
- Modify `packages/ui/src/providers/Auth/index.tsx`
  - Store the accepted activity timestamp, schedule/clear the checkpoint timer, and remove pathname activity wiring.
- Modify `test/auth/e2e.spec.ts`
  - Replace obsolete pointer/click/drawer/route cases with checkpoint mouse movement, focus, and request-deduplication coverage.
- Modify the same files in `/private/tmp/payload-activity-aware-auth-3x`
  - Apply the reviewed main commits while preserving 3.x router/test helper differences.

---

### Task 1: Narrow the activity coordinator to focus and mouse movement

**Files:**

- Modify: `packages/ui/src/providers/Auth/sessionActivity.ts`
- Modify: `packages/ui/src/providers/Auth/sessionActivity.spec.ts`

**Interfaces:**

- Produces: `SessionActivitySource = 'focus' | 'mousemove'`
- Preserves: `MarkSessionActivity`, `sessionActivityThrottleMs`, and `createSessionActivityTracker`
- Changes: `registerSessionActivityListeners({ markActivity, window })` no longer accepts `document`

- [ ] **Step 1: Replace tracker inputs in the unit tests**

Use only the two supported discriminants:

```ts
expect(markActivity('mousemove')).toBe(true)
expect(onActivity).toHaveBeenCalledWith('mousemove', 100)

now += sessionActivityThrottleMs - 1
expect(markActivity('focus')).toBe(false)
```

- [ ] **Step 2: Write failing listener registration and cleanup tests**

Replace the pointer, keyboard, input, wheel, and visibility assertions with:

```ts
it('should register only focus and mouse movement listeners', () => {
  const window = createWindow()
  const markActivity = vi.fn()

  registerSessionActivityListeners({ markActivity, window })

  expect(window.addEventListener).toHaveBeenCalledTimes(2)
  expect(window.addEventListener).toHaveBeenCalledWith(
    'focus',
    expect.any(Function),
    true,
  )
  expect(window.addEventListener).toHaveBeenCalledWith(
    'mousemove',
    expect.any(Function),
    {
      capture: true,
      passive: true,
    },
  )
})

it('should remove focus and mouse movement listeners', () => {
  const window = createWindow()
  const cleanup = registerSessionActivityListeners({
    markActivity: vi.fn(),
    window,
  })

  cleanup()

  expect(window.removeEventListener).toHaveBeenCalledTimes(2)
  expect(window.removeEventListener).toHaveBeenCalledWith(
    'focus',
    expect.any(Function),
    true,
  )
  expect(window.removeEventListener).toHaveBeenCalledWith(
    'mousemove',
    expect.any(Function),
    {
      capture: true,
      passive: true,
    },
  )
})
```

- [ ] **Step 3: Run the focused test and confirm RED**

Run:

```bash
mise exec node@24.15.0 -- pnpm vitest run --project unit packages/ui/src/providers/Auth/sessionActivity.spec.ts
```

Expected: failures show the old listener set and old `document` argument remain.

- [ ] **Step 4: Implement the narrow listener set**

Replace the obsolete union and listener body with:

```ts
export type SessionActivitySource = 'focus' | 'mousemove'

export function registerSessionActivityListeners({
  markActivity,
  window,
}: {
  markActivity: MarkSessionActivity
  window: Window
}): () => void {
  const focusListener = () => markActivity('focus')
  const mousemoveListener = () => markActivity('mousemove')
  const mousemoveListenerOptions = { capture: true, passive: true }

  window.addEventListener('focus', focusListener, true)
  window.addEventListener(
    'mousemove',
    mousemoveListener,
    mousemoveListenerOptions,
  )

  return () => {
    window.removeEventListener('focus', focusListener, true)
    window.removeEventListener(
      'mousemove',
      mousemoveListener,
      mousemoveListenerOptions,
    )
  }
}
```

- [ ] **Step 5: Delete obsolete unit helpers and assertions**

Remove `createDocument`, `visibilityState`, visibility dispatch logic, pathname state, and every assertion mentioning `input`, `keydown`, `pointerdown`, `route`, `visibility`, or `wheel` unless the next task replaces the containing provider test.

- [ ] **Step 6: Run GREEN verification**

Run:

```bash
mise exec node@24.15.0 -- pnpm vitest run --project unit packages/ui/src/providers/Auth/sessionActivity.spec.ts
mise exec node@24.15.0 -- pnpm prettier --check packages/ui/src/providers/Auth/sessionActivity.ts packages/ui/src/providers/Auth/sessionActivity.spec.ts
```

Expected: activity tests pass and formatting is clean.

- [ ] **Step 7: Commit**

```bash
git add packages/ui/src/providers/Auth/sessionActivity.ts packages/ui/src/providers/Auth/sessionActivity.spec.ts
mise exec node@24.15.0 -- git commit -m "refactor(ui): simplify session activity signals"
```

---

### Task 2: Add the recent-activity refresh checkpoint

**Files:**

- Modify: `packages/ui/src/providers/Auth/index.tsx`
- Modify: `packages/ui/src/providers/Auth/sessionActivity.spec.ts`

**Interfaces:**

- Consumes: `createSessionActivityTracker` and `registerSessionActivityListeners({ markActivity, window })`
- Adds internal refs: `activityCheckpointTimeoutRef` and `lastSessionActivityAtRef`
- Preserves public auth APIs and cross-tab types

- [ ] **Step 1: Update the AuthProvider test configuration**

Remove the pathname mock state. Keep the router mock only for navigation:

```ts
vi.mock('../RouterAdapter/index.js', () => ({
  useRouter: () => ({ replace: vi.fn() }),
}))
```

Use fake time and a five-minute response in checkpoint tests:

```ts
vi.useFakeTimers()
vi.setSystemTime(0)

async function renderAuthenticatedProvider({
  tokenLifetimeMs,
}: {
  tokenLifetimeMs: number
}) {
  const user = { collection: 'users', id: '1' }
  const createResponse = () => ({
    exp: Math.floor((Date.now() + tokenLifetimeMs) / 1000),
    token: 'token',
    user,
  })

  apiMocks.get.mockImplementation(async () => ({
    json: async () => createResponse(),
    status: 200,
  }))
  apiMocks.post.mockImplementation(async () => ({
    json: async () => createResponse(),
    status: 200,
  }))

  renderedContainer = document.createElement('div')
  document.body.append(renderedContainer)
  renderedRoot = createRoot(renderedContainer)

  await act(async () => {
    renderedRoot?.render(
      React.createElement(
        AuthProvider,
        { user: user as never },
        React.createElement('div'),
      ),
    )
  })
  await act(async () => {})
}
```

- [ ] **Step 2: Write a failing pre-window checkpoint test**

Render the provider, record mouse movement with three minutes remaining, and advance to the checkpoint:

```ts
it('should refresh at the checkpoint after recent pre-window activity', async () => {
  await renderAuthenticatedProvider({ tokenLifetimeMs: 300_000 })

  await act(async () => {
    await vi.advanceTimersByTimeAsync(120_000)
    window.dispatchEvent(new MouseEvent('mousemove'))
    await vi.advanceTimersByTimeAsync(60_000)
    await vi.advanceTimersByTimeAsync(1_001)
  })

  expect(apiMocks.post).toHaveBeenCalledTimes(1)
})
```

Expected timeline: activity at `2:00`, checkpoint at `3:00`, request after the one-second debounce.

- [ ] **Step 3: Write failing stale, inside-window, reset, and cleanup tests**

```ts
it('should not refresh at the checkpoint for activity older than the refresh window', async () => {
  await renderAuthenticatedProvider({ tokenLifetimeMs: 300_000 })

  window.dispatchEvent(new MouseEvent('mousemove'))
  await act(async () => vi.advanceTimersByTimeAsync(181_001))

  expect(apiMocks.post).not.toHaveBeenCalled()
})

it('should refresh when activity occurs after an empty checkpoint', async () => {
  await renderAuthenticatedProvider({ tokenLifetimeMs: 300_000 })

  await act(async () => vi.advanceTimersByTimeAsync(181_000))
  window.dispatchEvent(new Event('focus'))
  await act(async () => vi.advanceTimersByTimeAsync(1_001))

  expect(apiMocks.post).toHaveBeenCalledTimes(1)
})

it('should not reuse activity after a successful refresh', async () => {
  await renderAuthenticatedProvider({ tokenLifetimeMs: 300_000 })

  await act(async () => {
    await vi.advanceTimersByTimeAsync(120_000)
    window.dispatchEvent(new MouseEvent('mousemove'))
    await vi.advanceTimersByTimeAsync(61_001)
    await vi.advanceTimersByTimeAsync(180_000)
    await vi.advanceTimersByTimeAsync(1_001)
  })

  expect(apiMocks.post).toHaveBeenCalledTimes(1)
})

it('should clear the pending checkpoint on provider unmount', async () => {
  await renderAuthenticatedProvider({ tokenLifetimeMs: 300_000 })

  await act(async () => {
    await vi.advanceTimersByTimeAsync(120_000)
    window.dispatchEvent(new MouseEvent('mousemove'))
    renderedRoot?.unmount()
    renderedRoot = undefined
    await vi.advanceTimersByTimeAsync(61_001)
  })

  expect(apiMocks.post).not.toHaveBeenCalled()
})
```

- [ ] **Step 4: Run the tests and confirm RED**

Run:

```bash
mise exec node@24.15.0 -- pnpm vitest run --project unit packages/ui/src/providers/Auth/sessionActivity.spec.ts
```

Expected: the provider forgets pre-window activity and still references pathname activity.

- [ ] **Step 5: Add checkpoint refs and clear them with auth state**

Add alongside the existing timeout refs:

```ts
const activityCheckpointTimeoutRef =
  React.useRef<ReturnType<typeof setTimeout>>(null)
const lastSessionActivityAtRef = React.useRef<number>(undefined)
```

In `clearUserInMemory` and provider cleanup:

```ts
lastSessionActivityAtRef.current = undefined
clearTimeout(activityCheckpointTimeoutRef.current)
```

- [ ] **Step 6: Schedule the checkpoint whenever a token is applied**

Inside `applyUserResponse`, clear the old checkpoint before handling the response. For an authenticated response, clear remembered activity and schedule the new checkpoint next to the reminder and force-logout timers:

```ts
clearTimeout(activityCheckpointTimeoutRef.current)

if (userResponse?.user) {
  lastSessionActivityAtRef.current = undefined
  const refreshWindowMs = nextForceLogoutBufferMs * 2

  activityCheckpointTimeoutRef.current = setTimeout(
    () => {
      const checkpointAt = Date.now()
      const lastActivityAt = lastSessionActivityAtRef.current
      const hasRecentActivity =
        lastActivityAt !== undefined &&
        lastActivityAt <= checkpointAt &&
        checkpointAt - lastActivityAt <= refreshWindowMs

      if (hasRecentActivity) {
        refreshCookieEvent(true)
      }
    },
    Math.max(expiresInMs - refreshWindowMs, 0),
  )
}
```

Do not clear `lastSessionActivityAtRef` when a refresh request merely starts or fails; token application is the reset point.

- [ ] **Step 7: Store accepted focus/mouse movement and remove pathname wiring**

Change tracker construction to:

```ts
return createSessionActivityTracker({
  onActivity: (_source, occurredAt) => {
    lastSessionActivityAtRef.current = occurredAt
    refreshCookieEvent()
  },
})
```

Register with:

```ts
return registerSessionActivityListeners({ markActivity, window })
```

Delete:

```ts
const pathname = usePathname()

useEffect(() => {
  markActivity('route')
}, [pathname, markActivity])
```

Remove `usePathname` from imports.

- [ ] **Step 8: Run checkpoint tests and source checks**

Run:

```bash
mise exec node@24.15.0 -- pnpm vitest run --project unit packages/ui/src/providers/Auth/sessionActivity.spec.ts packages/ui/src/providers/Auth/sessionSync.spec.ts
mise exec node@24.15.0 -- pnpm lint packages/ui/src/providers/Auth/index.tsx packages/ui/src/providers/Auth/sessionActivity.ts
mise exec node@24.15.0 -- pnpm build:ui
```

Expected: activity and sync tests pass, changed production files lint cleanly, and all UI build tasks pass.

- [ ] **Step 9: Verify obsolete source paths are gone**

Run:

```bash
rg -n "pointerdown|keydown|visibilitychange|markActivity\('route'\)|addEventListener\('input'|addEventListener\('wheel'" packages/ui/src/providers/Auth/sessionActivity.ts packages/ui/src/providers/Auth/index.tsx
```

Expected: no matches.

- [ ] **Step 10: Commit**

```bash
git add packages/ui/src/providers/Auth/index.tsx packages/ui/src/providers/Auth/sessionActivity.spec.ts
mise exec node@24.15.0 -- git commit -m "feat(ui): refresh sessions from recent activity"
```

---

### Task 3: Focus browser coverage on checkpoint behavior

**Files:**

- Modify: `test/auth/e2e.spec.ts`

**Interfaces:**

- Preserves: `advanceToRemainingSessionTime`, `expectActivityRefresh`, and cross-tab E2E helpers
- Replaces: `dispatchManySessionActivityEvents` with `dispatchManyMousemoveEvents`

- [ ] **Step 1: Delete obsolete activity E2E cases**

Remove the cases for:

- pointerdown near the refresh window;
- selecting collection checkboxes;
- opening and closing document drawers;
- client-side route activity.

Do not rewrite checkbox, drawer, or route actions to dispatch synthetic mouse movement.

- [ ] **Step 2: Add the pre-window mouse movement checkpoint case**

```ts
test('should refresh at the checkpoint after recent mouse movement', async () => {
  const tokenExpirationMs = await readTokenExpirationMs(sessionPage)

  await advanceToRemainingSessionTime({
    page: sessionPage,
    remainingMs: 180_000,
    tokenExpirationMs,
  })

  const refreshResponse = sessionPage.waitForResponse((response) =>
    isActivityRefreshRequest(response.request()),
  )

  await sessionPage.dispatchEvent('body', 'mousemove')
  await sessionPage.clock.fastForward(60_001)
  await sessionPage.clock.fastForward(1_001)

  expect((await refreshResponse).status()).toBe(200)
})
```

- [ ] **Step 3: Add focus-inside-window coverage**

```ts
test('should refresh after window focus inside the refresh window', async () => {
  const tokenExpirationMs = await readTokenExpirationMs(sessionPage)

  await advanceToRemainingSessionTime({
    page: sessionPage,
    remainingMs: 90_000,
    tokenExpirationMs,
  })

  const refreshResponse = await expectActivityRefresh({
    activity: () =>
      sessionPage.evaluate(() => window.dispatchEvent(new Event('focus'))),
    page: sessionPage,
  })

  expect(refreshResponse.status()).toBe(200)
})
```

- [ ] **Step 4: Narrow the deduplication helper**

```ts
async function dispatchManyMousemoveEvents(page: Page): Promise<void> {
  await page.evaluate(() => {
    for (let index = 0; index < 20; index++) {
      window.dispatchEvent(new MouseEvent('mousemove'))
    }
  })
}
```

Update the deduplication case to call only `dispatchManyMousemoveEvents` and continue asserting exactly one refresh request.

- [ ] **Step 5: Run focused E2E RED/GREEN and inspect failures**

Run:

```bash
PORT=3104 mise exec node@24.15.0 -- pnpm test:e2e auth --grep "session activity|session synchronization"
```

Expected: the new activity cases and unchanged cross-tab cases pass. If Chromium is sandbox-blocked, rerun the exact command with the required host approval.

- [ ] **Step 6: Verify removed E2E concepts are absent**

Run:

```bash
rg -n "selecting collection checkboxes|document drawers|client-side route activity|PointerEvent|KeyboardEvent|InputEvent|WheelEvent|dispatchManySessionActivityEvents" test/auth/e2e.spec.ts
```

Expected: no matches.

- [ ] **Step 7: Commit**

```bash
git add test/auth/e2e.spec.ts
mise exec node@24.15.0 -- git commit -m "test(auth): cover activity refresh checkpoints"
```

---

### Task 4: Verify main and update the 3.x backport

**Files:**

- Verify main changes in the current worktree.
- Modify the same three implementation/test files in `/private/tmp/payload-activity-aware-auth-3x` through cherry-pick and conflict adaptation.

**Interfaces:**

- Main remains detached in the managed worktree.
- 3.x remains on `codex/activity-aware-auth-session-3.x` and is not pushed.

- [ ] **Step 1: Run exact main verification**

```bash
mise exec node@24.15.0 -- pnpm vitest run --project unit packages/ui/src/providers/Auth/sessionActivity.spec.ts packages/ui/src/providers/Auth/sessionSync.spec.ts
mise exec node@24.15.0 -- pnpm lint packages/ui/src/providers/Auth/index.tsx packages/ui/src/providers/Auth/sessionActivity.ts test/auth/AuthDebug.tsx
mise exec node@24.15.0 -- pnpm build:ui
mise exec node@24.15.0 -- pnpm test:types
PORT=3104 mise exec node@24.15.0 -- pnpm test:e2e auth --grep "session activity|session synchronization"
PORT=3104 mise exec node@24.15.0 -- pnpm test:e2e auth
git diff --check
git status --short
```

Expected: units, source lint, build, types, focused E2E, and full auth E2E pass. Restore `test/auth/payload-types.ts` and `tsconfig.base.json` if the test harness regenerates them; final status is clean.

- [ ] **Step 2: Cherry-pick the three implementation commits onto 3.x**

From `/private/tmp/payload-activity-aware-auth-3x`:

```bash
git cherry-pick \
  "$(git -C /Users/jflesch/.codex/worktrees/d865/payload-main log -1 --format=%H --grep='^refactor(ui): simplify session activity signals$')" \
  "$(git -C /Users/jflesch/.codex/worktrees/d865/payload-main log -1 --format=%H --grep='^feat(ui): refresh sessions from recent activity$')" \
  "$(git -C /Users/jflesch/.codex/worktrees/d865/payload-main log -1 --format=%H --grep='^test(auth): cover activity refresh checkpoints$')"
```

Resolve only expected branch differences:

- retain 3.x `next/navigation` imports and mocks;
- retain 3.x `ClientUser`/`TypedUser` types and nullable refresh return types;
- retain the existing 3.x `logoutViaNav` E2E helper;
- accept the same activity source, checkpoint, cleanup, and focused E2E behavior as main.

- [ ] **Step 3: Verify 3.x**

```bash
mise exec node@24.15.0 -- pnpm vitest run --project unit packages/ui/src/providers/Auth/sessionActivity.spec.ts packages/ui/src/providers/Auth/sessionSync.spec.ts
mise exec node@24.15.0 -- pnpm lint packages/ui/src/providers/Auth/index.tsx packages/ui/src/providers/Auth/sessionActivity.ts test/auth/AuthDebug.tsx
mise exec node@24.15.0 -- pnpm build:ui
mise exec node@24.15.0 -- pnpm test:types
PORT=3104 mise exec node@24.15.0 -- pnpm test:e2e auth --grep "session activity|session synchronization"
PORT=3104 mise exec node@24.15.0 -- pnpm test:e2e auth
git diff --check
git status --short
```

Expected: equivalent green verification and a clean 3.x worktree. Broad legacy `test/auth` lint findings may remain only when they are outside the changed regions and match the established 3.x baseline.

- [ ] **Step 4: Compare main and 3.x product behavior**

Run a range diff and direct source comparison. `sessionActivity.ts` should be byte-for-byte identical; `AuthProvider` may differ only for established branch types/navigation:

```bash
git range-diff origin/3.x...codex/activity-aware-auth-session-3.x
git diff --no-index /Users/jflesch/.codex/worktrees/d865/payload-main/packages/ui/src/providers/Auth/sessionActivity.ts /private/tmp/payload-activity-aware-auth-3x/packages/ui/src/providers/Auth/sessionActivity.ts
```

Expected: no product-behavior divergence.

- [ ] **Step 5: Final review**

Review the exact main and 3.x heads for:

- only focus and mouse movement listeners;
- one checkpoint timer per accepted token;
- recent-activity boundary correctness;
- no refresh loop after successful token application;
- timer/listener cleanup on logout and unmount;
- deletion of obsolete code and tests;
- unchanged cross-tab session behavior.
