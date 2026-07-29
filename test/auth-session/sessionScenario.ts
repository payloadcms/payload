import type { APIResponse, Browser, BrowserContext, Page, Response } from '@playwright/test'

import { expect } from '@playwright/test'

import type {
  AUTH_SESSION_REFRESH_BARRIER_PHASES,
  AuthSessionRefreshBarrierPhase,
  LoggedOutRoute,
} from './shared.js'

import { AdminUrlUtil } from '../__helpers/shared/adminUrlUtil.js'
import {
  AUTH_SESSION_TEST_ADMIN_ROUTES,
  AUTH_SESSION_TEST_ROUTES,
  authSessionAccessTokenCookieName,
  authSessionExpirationSelector,
  authSessionRefreshEndpointPathname,
  authSessionRefreshTokenCookieName,
  authSessionUsersSlug,
  createAuthSessionAPIURL,
} from './shared.js'

export type { LoggedOutRoute } from './shared.js'

export type AuthSessionCookie = Awaited<ReturnType<BrowserContext['cookies']>>[number]

export type TestOAuthCredentials = {
  accessToken: string
  refreshToken: string
}

export type SessionScenario = {
  advanceBy: (durationMs: number) => Promise<void>
  armRefreshBarrier: (phase: AuthSessionRefreshBarrierPhase) => Promise<void>
  close: () => Promise<void>
  disableBroadcastChannel: () => Promise<void>
  expectLoggedIn: (page: Page) => Promise<void>
  expectLoggedOut: (args: { page: Page; route: LoggedOutRoute }) => Promise<void>
  expectOAuthAccessTokenAuthenticated: (args: { accessToken: string }) => Promise<void>
  expectOAuthAccessTokenRevoked: (args: { accessToken: string }) => Promise<void>
  expectOAuthCredentialsRevoked: (args: { credentials: TestOAuthCredentials }) => Promise<void>
  login: () => Promise<Page>
  logout: (page: Page) => Promise<void>
  moveMouse: (page: Page) => Promise<void>
  openTab: () => Promise<Page>
  readAccessTokenCookie: () => Promise<AuthSessionCookie | undefined>
  readExpiration: (page: Page) => Promise<number>
  readOAuthCredentials: () => Promise<TestOAuthCredentials>
  readRefreshTokenCookie: () => Promise<AuthSessionCookie | undefined>
  readRotatedOAuthCredentialsFromResponse: (
    response: APIResponse | Response,
  ) => Promise<TestOAuthCredentials>
  refreshOAuthSession: (args: { credentials: TestOAuthCredentials }) => Promise<APIResponse>
  releaseRefreshBarrier: () => Promise<void>
  revokeOAuthSession: () => Promise<void>
  waitForRefresh: (page: Page) => Promise<Response>
  waitForRefreshBarrier: (enteredCount: number) => Promise<void>
}

/**
 * Creates an isolated browser session backed by the simplified OAuth test provider.
 *
 * Scenario helpers use real admin navigation, cookies, and HTTP endpoints. Advancing time moves
 * both Playwright's browser clock and the provider's server clock so expiration tests remain fast
 * and deterministic without intercepting authentication requests.
 */
export async function createSessionScenario({
  browser,
  serverURL,
}: {
  browser: Browser
  serverURL: string
}): Promise<SessionScenario> {
  const context = await browser.newContext()
  const url = new AdminUrlUtil(serverURL, authSessionUsersSlug)
  let nowMs = Date.now()
  let isMouseAtFirstPosition = false

  await context.clock.install({ time: nowMs })

  const createPage = (): Promise<Page> => context.newPage()
  const createAPIURL = (path: string): string => createAuthSessionAPIURL({ path, serverURL })

  const resetResponse = await context.request.post(createAPIURL(AUTH_SESSION_TEST_ROUTES.RESET), {
    data: { nowMs },
  })

  expect(resetResponse.status()).toBe(200)

  return {
    async advanceBy(durationMs) {
      const response = await context.request.post(
        createAPIURL(AUTH_SESSION_TEST_ROUTES.ADVANCE_CLOCK),
        { data: { durationMs } },
      )

      expect(response.status()).toBe(200)
      nowMs += durationMs

      await context.clock.fastForward(durationMs)
    },
    async armRefreshBarrier(phase) {
      const response = await context.request.post(
        createAPIURL(AUTH_SESSION_TEST_ROUTES.ARM_REFRESH_BARRIER),
        { data: { phase } },
      )

      expect(response.status()).toBe(200)
    },
    async close() {
      await context.close()
    },
    async disableBroadcastChannel() {
      await context.addInitScript(() => {
        Object.defineProperty(globalThis, 'BroadcastChannel', {
          configurable: true,
          value: undefined,
        })
      })
    },
    async expectLoggedIn(page) {
      await expect(page.locator('.nav')).toBeVisible()

      const response = await context.request.get(createAPIURL(`/${authSessionUsersSlug}/me`))
      const result = (await response.json()) as
        | {
            exp: number
            user: { id: number | string }
          }
        | {
            user: null
          }

      expect(response.status()).toBe(200)
      expect(result.user).not.toBeNull()

      if (!result.user) {
        throw new Error('Expected /me to return an authenticated user.')
      }

      expect(result.exp).toBeGreaterThan(0)
      expect(result.user.id).toBeDefined()
    },
    async expectLoggedOut({ page, route }) {
      const expectedPathname = new URL(`${url.admin}${AUTH_SESSION_TEST_ADMIN_ROUTES[route]}`)
        .pathname

      await expect.poll(() => new URL(page.url()).pathname).toBe(expectedPathname)
      await expect(page.locator('.nav')).toBeHidden()
      await expect
        .poll(async () => {
          const response = await context.request.get(createAPIURL(`/${authSessionUsersSlug}/me`))
          const result = (await response.json()) as
            | {
                exp: number
                user: { id: number | string }
              }
            | {
                user: null
              }

          expect(response.status()).toBe(200)

          return result.user
        })
        .toBeNull()
    },
    async expectOAuthAccessTokenAuthenticated({ accessToken }) {
      const response = await context.request.get(createAPIURL(`/${authSessionUsersSlug}/me`), {
        headers: {
          cookie: `${authSessionAccessTokenCookieName}=${accessToken}`,
        },
      })
      const result = (await response.json()) as {
        exp?: number
        user: { id: number | string } | null
      }

      expect(response.status()).toBe(200)
      expect(result.user).not.toBeNull()
      expect(result.exp).toBeGreaterThan(0)
    },
    async expectOAuthAccessTokenRevoked({ accessToken }) {
      const response = await context.request.get(createAPIURL(`/${authSessionUsersSlug}/me`), {
        headers: {
          cookie: `${authSessionAccessTokenCookieName}=${accessToken}`,
        },
      })
      const result = (await response.json()) as
        | {
            exp: number
            user: { id: number | string }
          }
        | {
            user: null
          }

      expect(response.status()).toBe(200)
      expect(result.user).toBeNull()
    },
    async expectOAuthCredentialsRevoked({ credentials }) {
      const response = await context.request.post(
        createAPIURL(`/${authSessionUsersSlug}/refresh-token`),
        {
          headers: {
            cookie: [
              `${authSessionAccessTokenCookieName}=${credentials.accessToken}`,
              `${authSessionRefreshTokenCookieName}=${credentials.refreshToken}`,
            ].join('; '),
          },
        },
      )
      const headers = response.headers()

      expect(response.status()).toBe(403)
      expect(headers['set-cookie']).toBeUndefined()
    },
    async login() {
      const response = await context.request.post(createAPIURL(AUTH_SESSION_TEST_ROUTES.LOGIN))

      expect(response.status()).toBe(200)

      const page = await createPage()

      await page.goto(url.account)
      await expect(page.locator(authSessionExpirationSelector)).toBeVisible()

      return page
    },
    async logout(page) {
      await page.locator('.user-menu__trigger').click()
      await page.locator('a[href$="/logout"]').click()
    },
    async moveMouse(page) {
      isMouseAtFirstPosition = !isMouseAtFirstPosition
      await page.mouse.move(isMouseAtFirstPosition ? 1 : 2, isMouseAtFirstPosition ? 1 : 2)
    },
    async openTab() {
      const page = await createPage()

      await page.goto(url.account)
      await expect
        .poll(async () => Number(await page.locator(authSessionExpirationSelector).textContent()))
        .toBeGreaterThan(0)

      return page
    },
    async readAccessTokenCookie() {
      return (await context.cookies()).find(
        (cookie) => cookie.name === authSessionAccessTokenCookieName,
      )
    },
    async readExpiration(page) {
      const expirationMs = Number(await page.locator(authSessionExpirationSelector).textContent())

      expect(expirationMs).toBeGreaterThan(0)

      return expirationMs
    },
    async readOAuthCredentials() {
      const cookies = await context.cookies()
      const accessToken = cookies.find(
        (cookie) => cookie.name === authSessionAccessTokenCookieName,
      )?.value
      const refreshToken = cookies.find(
        (cookie) => cookie.name === authSessionRefreshTokenCookieName,
      )?.value

      expect(accessToken).toBeDefined()
      expect(refreshToken).toBeDefined()

      return {
        accessToken: accessToken ?? '',
        refreshToken: refreshToken ?? '',
      }
    },
    async readRefreshTokenCookie() {
      return (await context.cookies()).find(
        (cookie) => cookie.name === authSessionRefreshTokenCookieName,
      )
    },
    async readRotatedOAuthCredentialsFromResponse(response) {
      const headers = 'allHeaders' in response ? await response.allHeaders() : response.headers()
      const setCookie = headers['set-cookie']
      const accessToken = setCookie?.match(
        new RegExp(`${authSessionAccessTokenCookieName}=([^;]+)`),
      )?.[1]
      const refreshToken = setCookie?.match(
        new RegExp(`${authSessionRefreshTokenCookieName}=([^;]+)`),
      )?.[1]

      expect(accessToken).toBeDefined()
      expect(refreshToken).toBeDefined()

      return {
        accessToken: accessToken ?? '',
        refreshToken: refreshToken ?? '',
      }
    },
    refreshOAuthSession({ credentials }) {
      return context.request.post(createAPIURL(`/${authSessionUsersSlug}/refresh-token`), {
        headers: {
          cookie: [
            `${authSessionAccessTokenCookieName}=${credentials.accessToken}`,
            `${authSessionRefreshTokenCookieName}=${credentials.refreshToken}`,
          ].join('; '),
        },
      })
    },
    async releaseRefreshBarrier() {
      const response = await context.request.post(
        createAPIURL(AUTH_SESSION_TEST_ROUTES.RELEASE_REFRESH_BARRIER),
      )

      expect(response.status()).toBe(200)
    },
    async revokeOAuthSession() {
      const response = await context.request.post(createAPIURL(AUTH_SESSION_TEST_ROUTES.REVOKE))

      expect(response.status()).toBe(200)
    },
    waitForRefresh(page) {
      return page.waitForResponse((response) => {
        const requestURL = new URL(response.url())

        return (
          response.request().method() === 'POST' &&
          requestURL.pathname === authSessionRefreshEndpointPathname &&
          requestURL.searchParams.has('refresh')
        )
      })
    },
    async waitForRefreshBarrier(enteredCount) {
      await expect
        .poll(async () => {
          const response = await context.request.get(
            createAPIURL(AUTH_SESSION_TEST_ROUTES.REFRESH_BARRIER_STATUS),
          )
          const result = (await response.json()) as {
            enteredCount: number
            isReleased: boolean
            phase: (typeof AUTH_SESSION_REFRESH_BARRIER_PHASES)[keyof typeof AUTH_SESSION_REFRESH_BARRIER_PHASES]
          } | null

          expect(response.status()).toBe(200)

          return result?.enteredCount ?? 0
        })
        .toBe(enteredCount)
    },
  }
}
