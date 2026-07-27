# Auth Provider Session Refactor

## Goal

Make the activity-aware authentication changes reviewable without changing their behavior.
The existing provider mixes React context state, token scheduling, activity detection, request
ordering, stale-response protection, explicit logout settlement, cross-tab synchronization, and
navigation. This refactor will give each of those concerns a clear boundary.

## Constraints

- Preserve the public `AuthContext` API.
- Preserve the existing refresh, inactivity, logout, and cross-tab behavior.
- Preserve support for both `BroadcastChannel` and the storage fallback.
- Preserve the existing real-provider Playwright scenarios as the end-to-end contract.
- Do not add configuration or alter token lifetime and refresh-window semantics.
- Do not move complexity into one equally large replacement hook.

## Considered Approaches

### 1. Move the provider body into one `useAuthSession` hook

This would shorten `index.tsx`, but it would only relocate the same tangled responsibilities. It
would not make request ordering or token scheduling easier to understand independently.

### 2. Extract focused coordinator and lifecycle units

This is the selected approach. A non-React request coordinator will own concurrency state. Focused
React lifecycle hooks will own timers, activity listeners, and cross-tab setup. The provider will
retain context state, HTTP request definitions, navigation, and composition.

### 3. Rewrite authentication as a reducer or full state machine

A reducer could make every transition explicit, but replacing the existing provider state model
would broaden the change and create unnecessary behavioral risk. It is not appropriate for this
refactor.

## Design

### Shared session types

Move `UserWithToken` out of `index.tsx` into a small shared type module. Re-export it from the
provider entry point so existing consumers do not change. This removes the current type dependency
from `sessionSync.ts` back to the provider implementation.

### Request coordinator

Create a non-React session request coordinator that owns:

- the serialized auth request queue;
- request sequence numbers;
- the current session generation;
- refresh request deduplication;
- deferred invalidation when a newer auth request is queued;
- explicit logout settlement and its pending state.

The coordinator will expose named operations rather than its internal promises and counters. HTTP
requests and state-application callbacks remain dependencies supplied by the provider, so the
coordinator does not know Payload routes, translations, React, or navigation.

The first extraction will preserve the current ordering algorithm. Redundant state may be removed
only when equivalence is clear and the existing race E2Es continue to pass.

### Session timing and activity lifecycle

Create a focused lifecycle hook that owns:

- refresh debounce timing;
- reminder timing;
- forced-expiration timing;
- the activity checkpoint;
- last-activity tracking;
- focus and mouse-movement listener registration;
- cleanup of those timers and listeners.

The hook will receive callbacks for refresh, expiration publication, inactivity navigation, and the
stay-logged-in modal. It will not own user state or make network requests.

### Cross-tab lifecycle

Wrap `createAuthSessionSync` setup and cleanup in a small hook. The existing pure synchronization
implementation and its discriminated event union remain unchanged. The provider supplies callbacks
for applying refreshed sessions, settling remote logout, resynchronizing the current user, and
navigating after invalidation.

### Provider responsibility

After extraction, `index.tsx` will be responsible for:

- public context types and value;
- React user, token, and permissions state;
- Payload HTTP request definitions;
- login and inactivity navigation;
- composing the request coordinator and lifecycle hooks.

The provider should no longer directly contain the queue, generation, timer, or synchronization
implementation details.

## Data Flow

1. A login, refresh, or `/me` response is accepted through the request coordinator.
2. The provider applies the accepted user response to React state.
3. The timing hook schedules reminder, activity checkpoint, and expiration work for that token.
4. Activity records a timestamp and uses the existing debounce/refresh-window rules.
5. A successful refresh is published through the synchronization hook.
6. Remote refresh, expiration, and logout events enter through the same coordinator and provider
   state-application paths, preventing stale work from restoring an invalid session.

## Error and Race Handling

- Network failures keep the existing toast or silent-logout behavior.
- An explicit logout continues to win over an in-flight refresh.
- Stale responses continue to be rejected by session generation.
- A failed refresh does not invalidate a session when a newer queued auth request can establish the
  current state.
- Storage fallback logout continues to settle server logout before prompting another tab to
  resynchronize.

## Testing

- Add only small, direct coordinator tests needed to prove the extracted ordering API. They should
  describe real concurrency outcomes and avoid broad implementation-detail assertions.
- Keep the existing focused activity and synchronization unit tests.
- Run all five real-provider auth-session Playwright scenarios.
- Run the general auth Playwright suite, test build, lint, formatting, and type checks before
  completion.

## Success Criteria

- `index.tsx` reads as provider composition instead of a session state machine.
- Queue, generation, timer, and synchronization refs are absent from `index.tsx`.
- No public API or observable session behavior changes.
- The extracted units have narrow, typed interfaces.
- Existing end-to-end session and logout-race coverage remains green.
