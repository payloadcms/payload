# Auth Session Readability Refactor

## Goal

Make the activity-aware authentication implementation read in terms of concrete product behavior
without changing authentication behavior.

The existing race protections remain required. This refactor changes names and module interfaces so
callers do not need to understand request generations, queue sequence numbers, pending
invalidations, React callback refs, or timer refs.

## Constraints

- Preserve the public `AuthContext` API.
- Preserve request ordering, refresh deduplication, stale-response rejection, logout settlement,
  activity refresh, expiration, and cross-tab behavior.
- Preserve both `BroadcastChannel` and storage fallback behavior.
- Do not add configuration, dependencies, comments that narrate self-explanatory code, or new
  authentication behavior.
- Keep the existing focused unit tests and real-provider Playwright tests as the behavioral
  contract.

## Names and Responsibilities

### Auth session requests

Rename `sessionRequestCoordinator.ts` to `authSessionRequests.ts` and
`createAuthSessionRequestCoordinator()` to `createAuthSessionRequests()`.

The provider will hold the returned object as `authRequests`. Its public operations will read as:

```ts
authRequests.queue(...)
authRequests.refresh(...)
authRequests.logOut(...)
authRequests.discardPendingResults()
authRequests.isLoggingOut()
```

The request context will expose:

```ts
type AuthRequestContext = {
  acceptResult: () => boolean
  invalidateWhenIdle: (invalidate: () => void) => void
  isCurrent: () => boolean
}
```

`isCurrent()` is a read-only check used before starting work. `acceptResult()` checks the same
session and logout conditions, clears obsolete delayed invalidation, and returns whether the caller
may apply the response. It does not execute a callback.

`invalidateWhenIdle()` runs a failed-refresh invalidation immediately when no newer auth request
exists, waits when a newer request is queued, and discards it when an accepted response changes the
session. Callers will no longer inspect the queue or clear pending invalidation directly.

### Cross-tab session synchronization

Rename `useSessionSync.ts` to `useCrossTabSessionSync.ts` and `useSessionSync()` to
`useCrossTabSessionSync()`.

The provider will hold the result as `crossTabSession`. This hook remains a thin React lifecycle
adapter around `createAuthSessionSync`: it creates one source ID, installs the cross-tab transport,
forwards events to current callbacks, publishes session events, and cleans up on unmount.

The underlying `sessionSync.ts` ordering and transport implementation will not be redesigned in
this change.

### Auth session timers

Rename `useSessionTiming.ts` to `useAuthSessionTimers.ts` and `useSessionTiming()` to
`useAuthSessionTimers()`.

The provider will hold the result as `sessionTimers`. Its operations will use concrete verbs:

```ts
sessionTimers.setExpiration(expirationMs)
sessionTimers.clear()
sessionTimers.getCurrentExpirationMs()
sessionTimers.getLatestExpirationMs()
sessionTimers.scheduleRefresh(forceRefresh)
```

The hook continues to own reminder, activity-checkpoint, refresh-debounce, and expiration timers,
plus the activity listeners that drive those timers. Their calculations and scheduling semantics
will not change.

## Provider Flow

The provider will describe the authentication flow without exposing coordinator bookkeeping:

```ts
return authRequests.refresh(async ({ acceptResult, invalidateWhenIdle, isCurrent }) => {
  if (!isCurrent()) {
    return null
  }

  const response = await refreshToken()

  if (response.status !== 200) {
    invalidateWhenIdle(invalidateSession)
    return null
  }

  const session = await response.json()

  if (!acceptResult()) {
    return null
  }

  setLocalSession(session)
  crossTabSession.publish(...)
  return session.user
})
```

Logout will similarly read as `authRequests.logOut({ clearSession, request })`.

Responses accepted by the current local request call `setLocalSession(session)` directly. An
external session change, such as login, logout, or a refreshed session received from another tab,
uses the two operations explicitly:

```ts
authRequests.discardPendingResults()
setLocalSession(session)
```

This keeps request invalidation visible at the call site without introducing an indirect
`replaceSession()` helper.

## Testing

- Change the focused request tests first to express the new API and verify they fail before the
  implementation changes.
- Keep assertions behavioral: request order, shared refreshes, stale-response rejection, logout
  precedence, and delayed invalidation.
- Rename the timer test file and test harness with the production hook.
- Run all focused Auth unit tests, the five real-provider auth-session Playwright tests, the general
  auth Playwright suite, UI type checking, linting, formatting, and `build:tests`.

## Success Criteria

- The provider uses `authRequests`, `crossTabSession`, and `sessionTimers`.
- `hasQueuedRequest`, `deferInvalidation`, `clearPendingInvalidation`, `advanceSession`,
  `coordinator`, `sessionSync`, `sessionTiming`, `applyUserResponse`, and `setNewUser` are absent
  from the provider.
- Each module name identifies the concrete behavior it owns.
- Request and timer bookkeeping remain private to their modules.
- No public API or observable authentication behavior changes.
