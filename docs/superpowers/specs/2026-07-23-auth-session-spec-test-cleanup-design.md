# Auth Session Spec Test Cleanup Design

## Goal

Make the auth-session spec tests understandable and reviewable without discarding meaningful coverage for timer, request-ordering, transport, and lifecycle races.

The cleanup should optimize for clear responsibility and observable behavior, not for preserving the current file layout or test count.

## Current Problem

Two spec files currently contain 1,470 lines and mix different testing levels:

- `sessionActivity.spec.ts`
  - Five unit tests for the activity tracker and browser listeners.
  - Nine `AuthProvider` integration tests using React, mocked requests, and fake timers.
- `sessionSync.spec.ts`
  - Twelve unit tests for the synchronization coordinator and its transports.
  - Fourteen `AuthProvider` integration tests for request ordering, remote events, logout, and cleanup.

The mixed responsibilities make filenames misleading, require unrelated setup in simple unit tests, and obscure the session timelines behind raw timer values.

## File Responsibilities

Split the tests into four purpose-specific files:

### `sessionActivity.spec.ts`

Keep only the five direct unit tests for:

- accepting the first activity event;
- enforcing the shared five-second leading throttle;
- accepting activity at the throttle boundary;
- registering only `window.focus` and `window.mousemove`;
- removing both listeners during cleanup.

This file must not render `AuthProvider` or mock application services.

### `AuthProvider.sessionActivity.spec.ts`

Move the provider-level activity tests here. Retain the cases that protect behavior difficult to prove reliably through browser tests:

- stale activity does not refresh at the checkpoint;
- an accepted local token cancels a queued checkpoint refresh;
- a rejected refresh can be retried after later activity;
- a token returned by refresh receives a usable next checkpoint;
- a late refresh response after unmount cannot recreate session timers;
- unmount clears a pending checkpoint.

Remove provider cases already demonstrated end to end:

- positive pre-window mouse movement refreshing at the checkpoint;
- focus inside the refresh window;
- repeated mouse movement producing one request.

The E2E suite remains the source of truth for those user-visible flows.

### `sessionSync.spec.ts`

Keep only direct synchronization-coordinator tests:

- event publication and discriminated payloads;
- remote event ordering and convergence;
- Storage fallback barriers and resynchronization;
- transport downgrade behavior;
- coordinator cleanup.

This file must not render `AuthProvider`.

### `AuthProvider.sessionSync.spec.ts`

Move provider-level synchronization tests here:

- public refresh API publication;
- overlapping and deferred request ordering;
- applying remote sessions without rebroadcast;
- canceling queued activity refresh after a remote token;
- expiration and force-logout publication;
- explicit and remote logout settlement;
- restoring or resynchronizing shared session state;
- ignoring late Storage responses after unmount.

Retain each case only when it exercises a distinct observable state transition or race. Remove a case when another retained test asserts the same branch and outcome with equal or stronger setup.

## Readability Rules

Provider tests should read as session timelines rather than timer calculations.

- Introduce named duration constants for token lifetime, refresh window, and refresh debounce.
- Add small helpers such as `advanceToCheckpoint`, `advancePastRefreshDebounce`, and `dispatchSessionActivity`.
- Prefer helpers that describe setup or time movement; keep assertions and the important event order visible in each test.
- Avoid magic values such as `358_998` in test bodies.
- Use test names that describe the triggering event and resulting session state.
- Keep one primary behavior per test.
- Group provider tests by checkpoint, token replacement, request settlement, logout, and cleanup.

Do not create a broad shared test framework. Extract a shared helper only when it removes substantial duplication without hiding ordering or introducing Vitest mock-hoisting complexity.

## Coverage Policy

Use the lowest test level that proves the behavior clearly:

- Pure tracker, event-ordering, and transport decisions stay unit tests.
- React provider coordination and race handling stay provider integration tests.
- Real browser events, clock installation, network requests, and cross-tab behavior stay E2E tests.

Do not duplicate an E2E flow in provider specs merely to preserve unit coverage. Provider specs should focus on negative cases and races that are expensive or brittle in Playwright.

Test deletion must be justified by one of:

- the same behavior is already covered at a more appropriate level;
- another retained test exercises the same branch and asserts an equal or stronger outcome;
- the test only verifies discarded implementation scaffolding.

## Verification

After restructuring:

- Run every new or moved spec file together.
- Confirm the focused Auth unit total and list the removed cases.
- Run formatting and `git diff --check`.
- Run the focused auth E2E activity and synchronization cases to confirm the coverage boundary remains intact.
- Restore generated E2E files.
- Compare the final test inventory against this design and ensure each test has a distinct stated purpose.

No production behavior should change as part of this cleanup.

## Scope

This cleanup applies only to the main worktree. The deferred 3.x backport and its paused cherry-pick state are not part of this work.
