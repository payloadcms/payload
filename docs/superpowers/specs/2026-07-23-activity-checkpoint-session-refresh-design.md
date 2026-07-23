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

## Testing

Unit coverage should prove:

- focus and mouse movement are the only registered browser activity listeners;
- activity timestamp updates remain throttled to once per five seconds;
- pre-window recent activity triggers exactly one refresh at the checkpoint;
- old activity does not trigger the checkpoint;
- activity inside the refresh window schedules a refresh;
- a successful refresh clears activity and schedules the next checkpoint;
- cleanup removes listeners and checkpoint timers.

End-to-end coverage should prove:

- mouse movement recorded before the refresh window causes a later checkpoint refresh;
- focusing the window inside the refresh window causes a refresh;
- repeated mouse movement does not create duplicate requests;
- existing cross-tab refresh, expiration, and logout behavior remains unchanged.

Remove browser tests whose only purpose was to prove that checkbox selection, drawer interaction, or route changes count as activity.

## Backport

Apply the same behavior and focused tests to the existing 3.x backport branch after main is verified.
