# Activity Checkpoint Session Refresh Design

## Goal

Keep an authenticated admin session alive when the user has recently focused the window or moved the mouse, without turning high-frequency mouse movement into high-frequency network traffic.

This replaces the broader activity model introduced by the activity-aware auth work. Route changes, pointer presses, keyboard input, form input, wheel events, and visibility changes will no longer count as session activity.

## Activity Signals

The client observes only:

- `window.focus`
- `window.mousemove`

Both signals flow through the existing leading activity throttle, so the stored activity timestamp is updated at most once every five seconds. Activity timestamps remain in refs or closures and do not cause React renders.

The activity coordinator continues reporting the accepted timestamp through its `onActivity` callback. `AuthProvider` stores that timestamp in a ref; the coordinator does not need a new public state API.

## Refresh Checkpoint

For each accepted token, calculate the existing refresh window as twice the force-logout buffer. With a five-minute token, the buffer is one minute and the refresh window begins with two minutes remaining.

Schedule an activity checkpoint at the beginning of that refresh window. At the checkpoint:

1. Read the most recent accepted focus or mouse-movement timestamp.
2. Treat it as recent when it occurred within the preceding refresh-window duration, including the boundary.
3. If activity is recent, call `refreshCookie(true)` once. The checkpoint itself establishes eligibility, while the existing one-second debounce and serialized refresh path still control the request.
4. If activity is absent or too old, do nothing.

Activity that occurs after the checkpoint, while the token is already inside its refresh window, immediately enters the existing one-second refresh debounce.

After any accepted new token, including a cross-tab refresh, clear the activity timestamp and schedule a checkpoint for that token. A failed refresh does not clear activity, allowing later focus or mouse movement inside the window to retry through the existing debounce and request serialization.

`AuthProvider` owns one checkpoint timer alongside its reminder and force-logout timers. Applying a token replaces the prior checkpoint timer. Logout, unauthenticated responses, and provider cleanup clear it.

## Example Timeline

For a token issued at `0:00` that expires at `5:00`:

1. The user moves the mouse at `2:00`; no request is sent.
2. The checkpoint runs at `3:00`, when two minutes remain.
3. The `2:00` activity is recent, so a refresh is scheduled through the one-second debounce.
4. The refresh completes around `3:01`, producing a token that expires around `8:01`.
5. If the user remains idle, the next checkpoint finds no activity since the successful refresh and does not refresh again.

This intentionally provides checkpoint-based sliding behavior rather than promising an expiration exactly five minutes after the last input.

## Existing Auth Behavior

- Preserve `AuthContext.refreshCookie` and `refreshCookieAsync`.
- Preserve request coalescing, ordering guards, and cross-tab synchronization.
- Preserve `admin.autoRefresh`. Its reminder behavior remains independent and may refresh an idle session when enabled.
- Preserve the force-logout timer and inactivity navigation.
- Do not persist activity in React state, browser storage, or across tabs.

## Obsolete Code Removal

Remove code that existed only for the discarded activity model rather than leaving dormant compatibility paths:

- remove `input`, `keydown`, `pointerdown`, `route`, `visibility`, and `wheel` from `SessionActivitySource`;
- remove their listener callbacks and listener options;
- remove pathname observation and its activity effect from `AuthProvider`, including imports that become unused;
- remove test helpers and assertions that dispatch or inspect the discarded signals;
- remove the checkbox, drawer, and route-activity E2E cases rather than rewriting them to produce mouse movement;
- remove the old multi-event E2E helper;
- remove any timer, ref, callback, or mock that becomes unused after the new checkpoint flow is implemented.

Keep code that remains necessary for cross-tab session synchronization, token-expiration assertions, request serialization, or the new checkpoint tests. The final change should not retain dead branches for the superseded behavior.

## End-to-End Auth Fixture

Session behavior should be verified through a dedicated test configuration rather than mocked
`AuthProvider` dependencies or hand-built browser messages. The fixture represents an OAuth-like
identity provider through Payload's actual custom-auth-strategy interface.

The fixture uses:

- a dedicated admin auth collection with local authentication disabled, provider sessions enabled
  by the fixture, and a five-minute virtual token lifetime;
- an opaque token stored in the real HTTP-only `payload-token` cookie;
- a server-side test session store mapping each token to a user and expiration;
- a custom `AuthStrategyFunction` that reads the cookie, rejects missing, revoked, or expired
  sessions, and returns the corresponding Payload user;
- a custom login endpoint that creates the provider session and sets the cookie;
- a collection `me` hook that returns the provider session expiration;
- a collection `refresh` hook that rotates the opaque token, invalidates the old token, extends the
  expiration, and returns `setCookie: true`;
- an `afterLogout` hook that invalidates the provider session;
- reset and clock endpoints available only in the dedicated test configuration.

The login, `/me`, `/refresh-token`, and `/logout` requests remain real. Payload's request
authentication, admin `AuthProvider`, cookie handling, refresh scheduling, routing, and
`BroadcastChannel` synchronization run without replacement.

The custom strategy alone is insufficient because a strategy only authenticates an incoming
request. The `me` and `refresh` hooks are required to expose and rotate an opaque provider token
without falling back to decoding or issuing a local JWT.

## Shared Virtual Time

The test does not wait for the configured token lifetime in wall-clock time. A shared test clock
controls the provider session store, and one context-wide Playwright clock installs at the same
timestamp. BrowserContext clock installation affects every existing and newly opened page in that
context.

The scenario helper advances time in this order:

1. Advance the provider clock through its real test-only HTTP endpoint.
2. Advance the context-wide Playwright clock once by the same duration.
3. Wait for the timers and resulting network requests to settle.

New tabs inherit the installed context-wide Playwright clock before navigating. This keeps token
expiration, activity checkpoints, force-logout timers, and cross-tab comparisons on one timeline.
The token lifetime can remain human-readable, such as five minutes, because advancing it takes
milliseconds rather than five real minutes.

Payload's cookie expiration may use the process wall clock; the custom strategy treats the provider
session store as the authentication authority. The cookie must remain present long enough for the
test, while the strategy decides whether its opaque value is current, expired, or revoked.

## Scenario Helper

Provide a small helper local to the dedicated E2E suite. Its API describes user actions and
observable session state:

- `login()` performs the real provider login flow and records the original cookie and expiration;
- `advanceBy(duration)` advances the provider and all browser clocks together;
- `moveMouse(page)` uses Playwright's mouse API;
- `openTab()` creates a page in the shared browser context at the current scenario time;
- `readExpiration(page)` reads the admin's rendered session expiration;
- `expectLoggedIn(page)` checks authenticated admin UI and `/me`;
- `expectLoggedOut(page)` checks the login or inactivity UI and unauthenticated `/me`;
- `waitForRefresh(page)` observes the real refresh request and response;
- `readTokenCookie()` reads the HTTP-only cookie through Playwright for rotation assertions.

The helper must not intercept or fulfill auth requests, expose `AuthProvider` callbacks, dispatch
synthetic focus or mouse events, or construct `BroadcastChannel` or `StorageEvent` messages.
Assertions and the important ordering of actions remain visible in each test.

Headless Chromium does not model real tab lifecycle changes for this suite: `bringToFront`, CDP
target activation, and keyboard tab switching leave both pages visible and emit neither a trusted
`focus` event nor `visibilitychange`. The focus listener therefore remains covered at the focused
unit boundary. The E2E suite must not simulate the missing browser lifecycle event.

## End-to-End Scenarios

The dedicated suite should prove:

1. A user logs in with a finite token, moves the mouse before the refresh window, refreshes at the
   checkpoint, receives a rotated cookie with a later expiration, and remains logged in past the
   original expiration.
2. With no activity, advancing to expiration logs the admin out and `/me` no longer returns a user.
3. If the provider session expires or is revoked before refresh, the next real refresh is rejected
   and the admin logs out.
4. Refreshing in one tab rotates the shared cookie, updates the second tab to the same expiration,
   and keeps both tabs authenticated past the original expiration.
5. Explicit logout in one tab invalidates the provider session and logs out the other tab.

Each scenario asserts user-visible admin state, the real HTTP result, and token state where
applicable. Token rotation is proven by comparing HTTP-only cookie values and confirming the old
token no longer authenticates.

## Unit-Test Boundary

Keep unit coverage only for deterministic behavior that cannot become more real by running it in a
browser:

- the five-second leading activity throttle;
- registration and cleanup of focus and mouse-movement listeners;
- stale token event rejection and equal-time event ordering;
- storage fallback privacy and transport downgrade;
- coordinator cleanup while a storage resynchronization is pending.

Do not retain mocked React-provider suites. Do not reproduce message-ordering tests by injecting raw
protocol messages into Playwright.

## Test Migration

Move the session-specific browser scenarios out of the general auth E2E file into the dedicated
custom-strategy suite. Replace them rather than keeping both versions. Remove test-only debug
controls and helpers when the dedicated suite no longer uses them.

The final inventory should be driven by the five real-browser scenarios and the focused protocol units, not
by preserving the previous test count.

## Backport

Apply the same behavior and focused tests to the existing 3.x backport branch after main is verified.
