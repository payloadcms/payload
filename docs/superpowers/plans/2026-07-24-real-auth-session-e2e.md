# Real Auth Session E2E Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the timing-heavy auth-session tests in the general auth suite with a dedicated end-to-end suite that proves real opaque-cookie authentication, token rotation, activity refresh, expiration, revocation, and cross-tab convergence without intercepting network requests or dispatching synthetic browser events.

**Architecture:** A dedicated `test/auth-session` Payload config uses a custom auth strategy backed by an in-memory provider session store. The browser receives an opaque HTTP-only `payload-token`; Payload's real `/me`, `/refresh-token`, and `/logout` endpoints authenticate it through the strategy, while collection hooks expose expiration, rotate it, and revoke it. A test-only HTTP clock advances the same virtual time used by the provider store, and a Playwright scenario helper advances one context-wide Playwright clock by the same duration.

**Tech Stack:** TypeScript, Payload custom auth strategies and collection auth hooks, React, Playwright, Playwright Clock, Vitest.

## Global Constraints

- Keep the Payload v3 backport paused.
- Do not use Playwright `page.route`, `route.fulfill`, `route.abort`, or mocked fetch responses.
- Do not call `window.dispatchEvent`, `BroadcastChannel.postMessage`, or `StorageEvent` from E2E tests.
- Exercise mouse activity with `page.mouse.move`. Keep focus listener coverage at the unit boundary because headless Chromium target activation emits neither a trusted `focus` event nor a `visibilitychange`; do not replace that gap with a synthetic event.
- Keep the auth cookie opaque and HTTP-only; tests may inspect it only through `browserContext.cookies()`.
- Use exported constant objects plus derived string unions for statuses, routes, and event names. Do not repeat string literals such as `'authenticated'`, `'unauthenticated'`, or route fragments across files.
- Keep discriminated unions strict: an authenticated result must contain its session; an unauthenticated result must not.
- Keep virtual token lifetime at five minutes (`300_000` ms), but never wait for wall-clock expiration.
- The server clock and the context-wide Playwright clock must advance through one scenario helper; BrowserContext clock installation covers every existing and newly opened page.
- Do not expose provider-store internals to assertions. Test through cookies, Payload REST endpoints, and rendered admin state.
- One E2E test covers one user-visible behavior.
- Retain unit tests only for browser primitives and ordering/fallback branches that cannot be driven reliably through a real browser:
  - activity throttling and listener lifecycle;
  - stale/equal-time session ordering;
  - storage notification privacy, fallback, downgrade, and cleanup.
- Remove session-specific tests and helpers from `test/auth/e2e.spec.ts` once their real equivalents pass.
- Restore `test/auth/AuthDebug.tsx` to its pre-session-change surface once the dedicated debug component is in use.
- Use `apply_patch` for hand edits and preserve unrelated worktree changes.

## File and Responsibility Map

| File                                                     | Responsibility                                                                                                                                            |
| -------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `test/auth-session/shared.ts`                            | Single source of truth for collection slug, strategy name, API paths, status values, selectors, and five-minute lifetime.                                 |
| `test/auth-session/sessionStore.ts`                      | Strongly typed provider clock and opaque server-side session lifecycle: create, read, rotate, revoke, reset, and advance.                                 |
| `test/auth-session/authFixture.ts`                       | Payload custom strategy, `me`/`refresh`/`afterLogout` hooks, and real login/reset/clock/revoke endpoints.                                                 |
| `test/auth-session/SessionDebug/index.tsx`               | Minimal client field that renders the AuthProvider's current expiration and user ID for browser assertions.                                               |
| `test/auth-session/config.ts`                            | Isolated Payload config with local auth disabled, auto-refresh disabled, seeded user, custom strategy, hooks, and fixture endpoints.                      |
| `test/auth-session/sessionScenario.ts`                   | Playwright utilities for login, clock advancement, real mouse activity, tabs, cookie inspection, refresh observation, and authenticated state assertions. |
| `test/auth-session/e2e.spec.ts`                          | Five real end-to-end behaviors approved after the headless-focus investigation.                                                                           |
| `test/auth-session/payload-types.ts`                     | Generated Payload types for the dedicated suite.                                                                                                          |
| `test/auth/e2e.spec.ts`                                  | Remove the session activity/synchronization sections and their timing/debug helpers.                                                                      |
| `test/auth/AuthDebug.tsx`                                | Remove the session-expiration output added only for the old general-auth E2E tests.                                                                       |
| `packages/ui/src/providers/Auth/sessionActivity.spec.ts` | Retain the two concise browser-primitive unit tests.                                                                                                      |
| `packages/ui/src/providers/Auth/sessionSync.spec.ts`     | Retain the six concise ordering/fallback/privacy unit tests.                                                                                              |

---

### Task 1: Build the real provider fixture and prove checkpoint refresh

**Files:**

- Create: `test/auth-session/shared.ts`
- Create: `test/auth-session/sessionStore.ts`
- Create: `test/auth-session/authFixture.ts`
- Create: `test/auth-session/SessionDebug/index.tsx`
- Create: `test/auth-session/config.ts`
- Create: `test/auth-session/sessionScenario.ts`
- Create: `test/auth-session/e2e.spec.ts`
- Generate: `test/auth-session/payload-types.ts`

**Interfaces:**

Use shared constant objects and derived unions:

```ts
export const AUTH_SESSION_TEST_ROUTES = {
  ADVANCE_CLOCK: '/test-auth/clock/advance',
  LOGIN: '/test-auth/login',
  RESET: '/test-auth/reset',
  REVOKE: '/test-auth/revoke',
} as const

export const AUTH_SESSION_TEST_STATUS = {
  AUTHENTICATED: 'authenticated',
  UNAUTHENTICATED: 'unauthenticated',
} as const

export type AuthSessionTestStatus =
  (typeof AUTH_SESSION_TEST_STATUS)[keyof typeof AUTH_SESSION_TEST_STATUS]

export const authSessionTokenLifetimeMs = 300_000
export const authSessionUsersSlug = 'auth-session-users'
export const authSessionStrategyName = 'test-provider'
export const authSessionStrategyID =
  `${authSessionUsersSlug}-${authSessionStrategyName}` as const
export const authSessionExpirationTestID = 'auth-session-expiration'
export const authSessionExpirationSelector =
  `[data-testid="${authSessionExpirationTestID}"]` as const
```

The store result must be a discriminated union:

```ts
import { randomUUID } from 'node:crypto'

import {
  AUTH_SESSION_TEST_STATUS,
  authSessionTokenLifetimeMs,
} from './shared.js'

export type ProviderSession = {
  expiresAtMs: number
  token: string
  userID: number | string
}

export type ProviderSessionLookup =
  | {
      session: ProviderSession
      status: typeof AUTH_SESSION_TEST_STATUS.AUTHENTICATED
    }
  | {
      status: typeof AUTH_SESSION_TEST_STATUS.UNAUTHENTICATED
    }

export function createProviderSessionStore() {
  let nowMs = Date.now()
  const sessions = new Map<string, ProviderSession>()

  const read = ({ token }: { token: null | string }): ProviderSessionLookup => {
    const session = token ? sessions.get(token) : undefined

    if (!session || session.expiresAtMs <= nowMs) {
      if (token) {
        sessions.delete(token)
      }

      return { status: AUTH_SESSION_TEST_STATUS.UNAUTHENTICATED }
    }

    return { session, status: AUTH_SESSION_TEST_STATUS.AUTHENTICATED }
  }

  const create = ({ userID }: { userID: number | string }): ProviderSession => {
    const token = randomUUID()
    const session = {
      expiresAtMs: nowMs + authSessionTokenLifetimeMs,
      token,
      userID,
    }

    sessions.set(token, session)

    return session
  }

  return {
    advanceBy({ durationMs }: { durationMs: number }): number {
      nowMs += durationMs
      return nowMs
    },
    create,
    read,
    reset({ nextNowMs }: { nextNowMs: number }): number {
      nowMs = nextNowMs
      sessions.clear()
      return nowMs
    },
    revoke({ token }: { token: null | string }): boolean {
      return token ? sessions.delete(token) : false
    },
    rotate({ token }: { token: null | string }): ProviderSessionLookup {
      const current = read({ token })

      if (current.status === AUTH_SESSION_TEST_STATUS.UNAUTHENTICATED) {
        return current
      }

      sessions.delete(current.session.token)

      return {
        session: create({ userID: current.session.userID }),
        status: AUTH_SESSION_TEST_STATUS.AUTHENTICATED,
      }
    },
  }
}
```

The fixture must use Payload's real auth extension points:

```ts
import type {
  AfterLogoutHook,
  AuthStrategyFunction,
  Endpoint,
  MeHook,
  RefreshHook,
} from 'payload'

import { extractJWT, generatePayloadCookie } from 'payload'

import type { AuthSessionUser } from './payload-types.js'

import {
  AUTH_SESSION_TEST_ROUTES,
  AUTH_SESSION_TEST_STATUS,
  authSessionStrategyID,
  authSessionUsersSlug,
} from './shared.js'
import { createProviderSessionStore } from './sessionStore.js'

export const providerSessionStore = createProviderSessionStore()

export const authenticateProviderSession: AuthStrategyFunction = async ({
  headers,
  payload,
}) => {
  const lookup = providerSessionStore.read({
    token: extractJWT({ headers, payload }),
  })

  if (lookup.status === AUTH_SESSION_TEST_STATUS.UNAUTHENTICATED) {
    return { user: null }
  }

  const user = await payload.findByID({
    id: lookup.session.userID,
    collection: authSessionUsersSlug,
  })

  return {
    user: {
      ...user,
      _strategy: authSessionStrategyID,
      collection: authSessionUsersSlug,
    },
  }
}

export const exposeProviderSessionExpiration: MeHook<AuthSessionUser> = ({
  args,
  user,
}) => {
  const lookup = providerSessionStore.read({
    token: extractJWT({ headers: args.req.headers, payload: args.req.payload }),
  })

  if (lookup.status === AUTH_SESSION_TEST_STATUS.UNAUTHENTICATED) {
    return
  }

  return {
    exp: Math.floor(lookup.session.expiresAtMs / 1000),
    user,
  }
}

export const rotateProviderSession: RefreshHook<AuthSessionUser> = ({
  args,
  user,
}) => {
  const lookup = providerSessionStore.rotate({
    token: extractJWT({ headers: args.req.headers, payload: args.req.payload }),
  })

  if (lookup.status === AUTH_SESSION_TEST_STATUS.UNAUTHENTICATED) {
    return
  }

  return {
    exp: Math.floor(lookup.session.expiresAtMs / 1000),
    refreshedToken: lookup.session.token,
    setCookie: true,
    user,
  }
}

export const revokeProviderSessionAfterLogout: AfterLogoutHook<
  AuthSessionUser
> = ({ req }) => {
  providerSessionStore.revoke({
    token: extractJWT({ headers: req.headers, payload: req.payload }),
  })
}
```

Implement four root endpoints in the same file:

- `POST /api/test-auth/reset` accepts `{ nowMs: number }`, clears provider sessions, and sets the provider clock.
- `POST /api/test-auth/login` finds the seeded user, creates an opaque provider session, and responds with `Set-Cookie` generated by `generatePayloadCookie`.
- `POST /api/test-auth/clock/advance` accepts `{ durationMs: number }` and advances only the provider clock.
- `POST /api/test-auth/revoke` extracts the current opaque cookie and revokes it without clearing the browser cookie.

Validate request bodies and return status `400` for non-finite, negative, or missing time values. Export the endpoints as `authSessionTestEndpoints: Endpoint[]`.

The login response must set the real Payload cookie:

```ts
const session = providerSessionStore.create({ userID: user.id })
const collectionAuthConfig =
  req.payload.collections[authSessionUsersSlug].config.auth
const cookie = generatePayloadCookie({
  collectionAuthConfig,
  cookiePrefix: req.payload.config.cookiePrefix,
  token: session.token,
})

return Response.json(
  {
    expiresAtMs: session.expiresAtMs,
  },
  {
    headers: {
      'Set-Cookie': cookie,
    },
  },
)
```

The client debug field must render AuthProvider state, not provider-store state:

```tsx
'use client'

import type { UIField } from 'payload'

import { useAuth } from '@payloadcms/ui'
import React from 'react'

import { authSessionExpirationTestID } from '../shared.js'

export const SessionDebug: React.FC<UIField> = () => {
  const { tokenExpirationMs, user } = useAuth()

  return (
    <output data-testid={authSessionExpirationTestID} data-user-id={user?.id}>
      {tokenExpirationMs}
    </output>
  )
}
```

The config must:

- call `buildConfigWithDefaults(config, { disableAutoLogin: true })`;
- set `admin.autoRefresh: false`;
- use `authSessionUsersSlug` as `admin.user`;
- set `auth.tokenExpiration: authSessionTokenLifetimeMs / 1000`;
- set `auth.disableLocalStrategy: true`;
- set `auth.useSessions: false`;
- register `authenticateProviderSession`;
- register the `me`, `refresh`, and `afterLogout` hooks;
- add a required `name` text field and the `SessionDebug` UI field;
- seed one user in `onInit`;
- reset the provider store to `Date.now()` in `onInit`;
- configure generated types at `test/auth-session/payload-types.ts`.

Wire those requirements with this collection shape:

```ts
const authSessionUsers: CollectionConfig = {
  slug: authSessionUsersSlug,
  admin: {
    useAsTitle: 'name',
  },
  auth: {
    disableLocalStrategy: true,
    strategies: [
      {
        authenticate: authenticateProviderSession,
        name: authSessionStrategyName,
      },
    ],
    tokenExpiration: authSessionTokenLifetimeMs / 1000,
    useSessions: false,
  },
  fields: [
    {
      name: 'name',
      required: true,
      type: 'text',
    },
    {
      name: 'sessionDebug',
      type: 'ui',
      admin: {
        components: {
          Field: './SessionDebug/index.js#SessionDebug',
        },
      },
    },
  ],
  hooks: {
    afterLogout: [revokeProviderSessionAfterLogout],
    me: [exposeProviderSessionExpiration],
    refresh: [rotateProviderSession],
  },
}
```

Seed idempotently in `onInit`: find one `authSessionUsersSlug` document with `limit: 1`; create `{ name: 'Session Test User' }` only when none exists. Reset `providerSessionStore` after the seed completes.

The Playwright helper must expose this exact capability surface:

```ts
export type LoggedOutRoute = 'inactivity' | 'login'

export type AuthSessionCookie = Awaited<
  ReturnType<BrowserContext['cookies']>
>[number]

export type SessionScenario = {
  advanceBy: (durationMs: number) => Promise<void>
  close: () => Promise<void>
  expectLoggedIn: (page: Page) => Promise<void>
  expectLoggedOut: (args: {
    page: Page
    route: LoggedOutRoute
  }) => Promise<void>
  login: () => Promise<Page>
  logout: (page: Page) => Promise<void>
  moveMouse: (page: Page) => Promise<void>
  openTab: () => Promise<Page>
  readExpiration: (page: Page) => Promise<number>
  readTokenCookie: () => Promise<AuthSessionCookie | undefined>
  revoke: () => Promise<void>
  waitForRefresh: (page: Page) => Promise<Response>
}
```

`createSessionScenario` must create its own `BrowserContext`, set a single `nowMs`, reset the server fixture, and install one context-wide Playwright Clock before page navigation; BrowserContext installation covers every existing and newly opened page. `advanceBy` must first advance the provider through the HTTP endpoint, increment `nowMs`, and then call `context.clock.fastForward(durationMs)` once. `moveMouse` must alternate coordinates so it always produces a real movement. `waitForRefresh` must observe the real `POST /api/auth-session-users/refresh-token?refresh` response without routing or modifying it.

Create and close one scenario per test through Playwright hooks so cleanup still runs after a failed assertion:

```ts
let scenario: SessionScenario

test.beforeEach(async ({ browser }) => {
  scenario = await createSessionScenario({ browser, serverURL })
})

test.afterEach(async () => {
  await scenario.close()
})
```

- [ ] Add the shared constants, route names, status union, selectors, and lifetime.
- [ ] Add a minimal dedicated config, debug field, scenario helper, and the first E2E test below, but do not add the provider endpoints or hooks yet.
- [ ] Write the first test:

```ts
test('should refresh at the checkpoint after mouse activity before the refresh window', async () => {
  const page = await scenario.login()
  const originalExpiration = await scenario.readExpiration(page)
  const originalCookie = await scenario.readTokenCookie()

  await scenario.advanceBy(120_000)
  await scenario.moveMouse(page)
  await scenario.advanceBy(60_000)
  const refreshResponse = scenario.waitForRefresh(page)

  await scenario.advanceBy(1_001)

  expect((await refreshResponse).status()).toBe(200)
  expect((await scenario.readTokenCookie())?.value).not.toBe(
    originalCookie?.value,
  )
  expect(await scenario.readExpiration(page)).toBeGreaterThan(
    originalExpiration,
  )

  await scenario.advanceBy(120_000)
  await scenario.expectLoggedIn(page)
})
```

- [ ] Run `pnpm test:e2e auth-session --workers=1 --grep "checkpoint after mouse"` and confirm RED because the real login endpoint/auth strategy does not exist yet.
- [ ] Implement the provider store exactly as the typed lifecycle above.
- [ ] Implement the custom strategy, auth hooks, and four HTTP endpoints.
- [ ] Wire the strategy, hooks, endpoints, seed, and debug field into the config.
- [ ] Run `pnpm dev:generate-types auth-session` and retain `test/auth-session/payload-types.ts`.
- [ ] Run `pnpm test:e2e auth-session --workers=1 --grep "checkpoint after mouse"` and confirm GREEN with one real refresh response, a rotated cookie, a later expiration, and a still-visible admin after the original expiration.
- [ ] Commit: `git add test/auth-session && git commit -m "test(ui): add real auth session provider fixture"`

---

### Task 2: Cover inactivity expiration and finalize authenticated-state helpers

**Files:**

- Modify: `test/auth-session/e2e.spec.ts`
- Modify: `test/auth-session/sessionScenario.ts`

**Interfaces:**

Add no direct clock access to the test file. All time must continue through `scenario.advanceBy`.

Remove the uncommitted focus RED test and the unused `focus` scenario method. The investigation established that headless Chromium keeps both pages visible and emits neither `focus` nor `visibilitychange` for `bringToFront`, target activation, or keyboard tab switching. Do not add synthetic events, focus emulation, or headed-only CI behavior.

Use the actual `/me` endpoint in state assertions:

```ts
const response = await context.request.get(
  `${serverURL}/api/${authSessionUsersSlug}/me`,
)
const result = (await response.json()) as
  | {
      exp: number
      user: { id: number | string }
    }
  | {
      user: null
    }
```

`expectLoggedIn` must require visible admin navigation and an authenticated `/me` result. `expectLoggedOut` must require the selected real admin route and an unauthenticated `/me` result.

- [ ] Remove the uncommitted `should refresh after returning focus within the refresh window` RED case from `test/auth-session/e2e.spec.ts`.
- [ ] Remove the unused `focus` method from `SessionScenario` and `createSessionScenario`.
- [ ] Add a failing inactivity test:

```ts
test('should expire and log out without activity', async () => {
  const page = await scenario.login()

  await scenario.advanceBy(authSessionTokenLifetimeMs + 1)

  await scenario.expectLoggedOut({ page, route: 'inactivity' })
})
```

- [ ] Run `pnpm test:e2e auth-session --workers=1 --grep "without activity"` and confirm RED before the logged-out assertion is complete.
- [ ] Complete `expectLoggedOut` so it polls the real inactivity URL, hidden admin navigation, and `/me` returning `user: null`.
- [ ] Run `pnpm test:e2e auth-session --workers=1` and confirm both committed tests GREEN without wall-clock waiting.
- [ ] Commit: `git add test/auth-session && git commit -m "test(ui): cover auth session inactivity expiry"`

---

### Task 3: Cover provider revocation and cross-tab refresh convergence

**Files:**

- Modify: `test/auth-session/e2e.spec.ts`
- Modify: `test/auth-session/sessionScenario.ts`
- Modify if needed: `test/auth-session/authFixture.ts`

**Interfaces:**

`scenario.revoke()` must POST to the real revoke endpoint with the current HTTP-only cookie. The endpoint must invalidate only the server-side session and must not clear the browser cookie.

Cross-tab assertions must compare each page's rendered AuthProvider expiration:

```ts
const firstExpiration = await scenario.readExpiration(firstPage)
const secondExpiration = await scenario.readExpiration(secondPage)

expect(secondExpiration).toBe(firstExpiration)
```

- [ ] Add a failing provider-rejection test that logs in, advances into the refresh window, revokes the provider session through the real endpoint, moves the real mouse, waits for the actual refresh response, and advances the one-second debounce.
- [ ] Assert the real refresh response is `403`, the browser still sent its formerly valid opaque cookie, and the admin reaches `/admin/logout-inactivity`.
- [ ] Run `pnpm test:e2e auth-session --workers=1 --grep "provider revokes"` and confirm RED before revocation is wired through the strategy.
- [ ] Fix the fixture only as needed so the custom strategy rejects the revoked opaque cookie and Payload's real refresh endpoint returns `403`.
- [ ] Run the provider-rejection test and confirm GREEN.
- [ ] Add a failing two-tab refresh test that:
  - logs in on the first page;
  - opens a second authenticated tab in the same context;
  - records the original cookie and both original expirations;
  - moves the real mouse before the window on the first page;
  - advances to the checkpoint and through the one-second debounce;
  - observes one real refresh response;
  - asserts the cookie rotated;
  - asserts both rendered expirations converge to the same later value;
  - advances past the original expiration;
  - asserts both tabs remain logged in.
- [ ] Run `pnpm test:e2e auth-session --workers=1 --grep "second tab"` and confirm RED before real BroadcastChannel convergence is proven.
- [ ] Fix production code only if the real two-tab flow exposes a defect. Do not access BroadcastChannel or storage directly from the test.
- [ ] Run `pnpm test:e2e auth-session --workers=1 --grep "provider revokes|second tab"` and confirm both tests GREEN.
- [ ] Commit: `git add test/auth-session packages/ui/src/providers/Auth && git commit -m "test(ui): cover provider revocation and tab refresh"`

---

### Task 4: Cover explicit logout and remove the replaced general-auth E2E

**Files:**

- Modify: `test/auth-session/e2e.spec.ts`
- Modify: `test/auth-session/sessionScenario.ts`
- Modify if needed: `test/auth-session/authFixture.ts`
- Modify: `test/auth/e2e.spec.ts`
- Modify: `test/auth/AuthDebug.tsx`

**Interfaces:**

`scenario.logout(page)` must use the admin UI:

```ts
await page.locator('.user-menu__trigger').click()
await page.locator('a[href$="/logout"]').click()
```

The provider's `afterLogout` hook must invalidate the opaque token before Payload's real endpoint expires the cookie.

- [ ] Add a failing explicit-logout test that logs in, opens a second authenticated tab, logs out through the first tab's user menu, and asserts both tabs reach the real login route.
- [ ] Also assert `/me` returns `user: null` and `readTokenCookie()` returns `undefined`.
- [ ] Run `pnpm test:e2e auth-session --workers=1 --grep "explicit logout"` and confirm RED before both server revocation and tab propagation are proven.
- [ ] Fix only the real logout hook or synchronization behavior needed to make the test pass.
- [ ] Run the explicit-logout test and confirm GREEN.
- [ ] Run the complete dedicated suite with `pnpm test:e2e auth-session --workers=1` and confirm all five tests GREEN:
  1. mouse activity before the refresh window refreshes at the checkpoint;
  2. no activity expires and logs out;
  3. provider revocation rejects refresh and logs out;
  4. a refresh in one tab rotates the cookie and keeps both tabs alive;
  5. explicit logout invalidates the provider session and logs out both tabs.
- [ ] Delete the `session activity` and `session synchronization` `describe` blocks from `test/auth/e2e.spec.ts`.
- [ ] Delete the old E2E-only helpers from the bottom of `test/auth/e2e.spec.ts`: `advanceToRemainingSessionTime`, `expectActivityRefresh`, `isActivityRefreshRequest`, `observeActivityRefreshRequests`, `openAuthenticatedPage`, `readTokenExpirationMs`, `refreshSessionFromDebugButton`, and `waitForServerClockAfterTokenIssue`.
- [ ] Restore the Playwright type import in `test/auth/e2e.spec.ts` to the types still used by the remaining suite.
- [ ] Remove `tokenExpirationMs` from the `useAuth` destructure and remove `#token-expiration-ms` from `test/auth/AuthDebug.tsx`. Keep the pre-existing refresh button and refresh-count behavior.
- [ ] Run `pnpm test:e2e auth --workers=1` and confirm the remaining general auth suite is GREEN.
- [ ] Run `pnpm test:e2e auth-session --workers=1` again and confirm the dedicated suite remains GREEN.
- [ ] Commit: `git add test/auth test/auth-session && git commit -m "test(ui): replace simulated auth session e2e"`

---

### Task 5: Keep only reviewable unit-boundary coverage

**Files:**

- Review: `packages/ui/src/providers/Auth/sessionActivity.spec.ts`
- Review: `packages/ui/src/providers/Auth/sessionSync.spec.ts`
- Preserve deletion: `packages/ui/src/providers/Auth/AuthProvider.sessionActivity.spec.ts`
- Preserve deletion: `packages/ui/src/providers/Auth/AuthProvider.sessionSync.spec.ts`
- Preserve deletion: `packages/ui/test/sessionSync.ts`
- Preserve deletion: `packages/ui/test/tsconfig.json`
- Preserve deletion: `docs/superpowers/plans/2026-07-23-auth-session-spec-test-cleanup.md`
- Preserve deletion: `docs/superpowers/specs/2026-07-23-auth-session-spec-test-cleanup-design.md`

**Interfaces:**

The retained unit-test inventory is exactly eight tests:

`sessionActivity.spec.ts`

1. throttles activity for five seconds;
2. registers and removes only `focus` and `mousemove` listeners.

`sessionSync.spec.ts`

1. publishes a refreshed session with typed source/timing metadata;
2. ignores stale refresh and expiration messages;
3. makes logout win equal-time ordering in either arrival order;
4. keeps storage fallback notification-only and resynchronizes from the cookie;
5. downgrades a failed BroadcastChannel to storage fallback;
6. ignores an in-flight storage resync after cleanup.

- [ ] Confirm `rg -n "\\b(it|test)\\(" packages/ui/src/providers/Auth/sessionActivity.spec.ts packages/ui/src/providers/Auth/sessionSync.spec.ts` returns exactly eight test declarations.
- [ ] Read every retained test and ensure its title describes the observable branch, setup is local to the test, and assertions do not duplicate one of the five E2E scenarios.
- [ ] Keep the existing discriminated unions and `AUTH_SESSION_SYNC_EVENT_TYPES` imports; do not replace them with repeated string literals.
- [ ] Keep session-bearing variants strict so `REFRESHED` requires `session`, `EXPIRED` requires `expiredTokenAt`, and `LOGGED_OUT` accepts neither.
- [ ] Run:

```sh
pnpm vitest --run --project unit \
  packages/ui/src/providers/Auth/sessionActivity.spec.ts \
  packages/ui/src/providers/Auth/sessionSync.spec.ts
```

- [ ] Confirm exactly eight unit tests pass.
- [ ] Run `git diff --check` and fix whitespace errors.
- [ ] Commit: `git add packages/ui/src/providers/Auth packages/ui/test docs/superpowers && git commit -m "test(ui): keep focused auth session unit coverage"`

---

### Task 6: Verify the complete change and review it against the design

**Files:**

- Review: `docs/superpowers/specs/2026-07-23-activity-checkpoint-session-refresh-design.md`
- Review: `docs/superpowers/plans/2026-07-23-activity-checkpoint-session-refresh.md`
- Review: all files changed from `main`

**Verification:**

- [ ] Run the focused unit tests:

```sh
pnpm vitest --run --project unit \
  packages/ui/src/providers/Auth/sessionActivity.spec.ts \
  packages/ui/src/providers/Auth/sessionSync.spec.ts
```

Expected: exactly eight passing unit tests.

- [ ] Run the dedicated real E2E suite:

```sh
pnpm test:e2e auth-session --workers=1
```

Expected: exactly five passing E2E tests, no intercepted/fulfilled/aborted requests, no synthetic focus events, and no wall-clock wait for token expiration.

- [ ] Run the cleaned general auth suite:

```sh
pnpm test:e2e auth --workers=1
```

Expected: all pre-existing general auth tests pass with no session-activity or session-synchronization sections.

- [ ] Run the repository test-suite typecheck:

```sh
pnpm build:tests
```

Expected: exit code `0`.

- [ ] Run lint on the touched TypeScript files:

```sh
pnpm eslint \
  packages/ui/src/providers/Auth/index.tsx \
  packages/ui/src/providers/Auth/sessionActivity.ts \
  packages/ui/src/providers/Auth/sessionActivity.spec.ts \
  packages/ui/src/providers/Auth/sessionSync.ts \
  packages/ui/src/providers/Auth/sessionSync.spec.ts \
  test/auth/AuthDebug.tsx \
  test/auth/e2e.spec.ts \
  test/auth-session
```

Expected: exit code `0`.

- [ ] Run placeholder and forbidden-technique scans:

```sh
rg -n "TODO|FIXME|page\\.route|route\\.(abort|fulfill)|dispatchEvent|BroadcastChannel|StorageEvent" \
  test/auth-session
```

Expected: no output.

- [ ] Run the literal consistency scan:

```sh
rg -n "'session-(expired|refreshed|logged-out)'|\"session-(expired|refreshed|logged-out)\"" \
  packages/ui/src/providers/Auth \
  test/auth-session
```

Expected: event string definitions appear only in the exported constant object; call sites import and use constant members.

- [ ] Run `git diff --check`.
- [ ] Run `git status --short` and verify only intended feature/test/docs changes remain.
- [ ] Review `git diff main --stat` and `git diff main` against every requirement in the approved design.
- [ ] Confirm the suite proves the five-minute example without sleeping:
  - login at virtual minute 0;
  - mouse at minute 2;
  - checkpoint refresh near minute 3;
  - rotated token expires near minute 8;
  - the admin remains logged in after the original minute-5 expiration.
- [ ] Confirm the fixture is test-only and no provider-specific code enters a published package.
- [ ] If verification requires fixes, stage each named fixed file explicitly and commit: `git commit -m "test(ui): finalize auth session coverage"`
