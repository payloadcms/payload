import type { Browser, BrowserContext, Page, Response } from '@playwright/test'

import { expect } from '@playwright/test'

import { AdminUrlUtil } from '../__helpers/shared/adminUrlUtil.js'
import {
  AUTH_SESSION_TEST_ADMIN_ROUTES,
  AUTH_SESSION_TEST_ROUTES,
  authSessionExpirationSelector,
  authSessionRefreshEndpointPathname,
  authSessionUsersSlug,
  type LoggedOutRoute,
} from './shared.js'

export type { LoggedOutRoute } from './shared.js'

export type AuthSessionCookie = Awaited<ReturnType<BrowserContext['cookies']>>[number]

export type SessionScenario = {
  advanceBy: (durationMs: number) => Promise<void>
  close: () => Promise<void>
  expectLoggedIn: (page: Page) => Promise<void>
  expectLoggedOut: (args: { page: Page; route: LoggedOutRoute }) => Promise<void>
  login: () => Promise<Page>
  logout: (page: Page) => Promise<void>
  moveMouse: (page: Page) => Promise<void>
  openTab: () => Promise<Page>
  readExpiration: (page: Page) => Promise<number>
  readTokenCookie: () => Promise<AuthSessionCookie | undefined>
  revoke: () => Promise<void>
  waitForRefresh: (page: Page) => Promise<Response>
}

export async function createSessionScenario({
  browser,
  serverURL,
}: {
  browser: Browser
  serverURL: string
}): Promise<SessionScenario> {
  const context = await browser.newContext()
  const url = new AdminUrlUtil(serverURL, authSessionUsersSlug)
  const pages = new Set<Page>()
  const nowMs = Date.now()
  let isMouseAtFirstPosition = false

  const createPage = async (): Promise<Page> => {
    const page = await context.newPage()

    pages.add(page)
    page.on('close', () => pages.delete(page))
    await page.clock.install({ time: nowMs })

    return page
  }

  const resetResponse = await context.request.post(
    `${serverURL}/api${AUTH_SESSION_TEST_ROUTES.RESET}`,
    {
      data: { nowMs },
    },
  )

  expect(resetResponse.status()).toBe(200)

  return {
    async advanceBy(durationMs) {
      const response = await context.request.post(
        `${serverURL}/api${AUTH_SESSION_TEST_ROUTES.ADVANCE_CLOCK}`,
        { data: { durationMs } },
      )

      expect(response.status()).toBe(200)
      await Promise.all([...pages].map((page) => page.clock.fastForward(durationMs)))
    },
    async close() {
      await context.close()
    },
    async expectLoggedIn(page) {
      await expect(page.locator('.nav')).toBeVisible()

      const response = await context.request.get(`${serverURL}/api/${authSessionUsersSlug}/me`)
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
          const response = await context.request.get(`${serverURL}/api/${authSessionUsersSlug}/me`)
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
    async login() {
      const response = await context.request.post(
        `${serverURL}/api${AUTH_SESSION_TEST_ROUTES.LOGIN}`,
      )

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

      return page
    },
    async readExpiration(page) {
      const expirationMs = Number(await page.locator(authSessionExpirationSelector).textContent())

      expect(expirationMs).toBeGreaterThan(0)

      return expirationMs
    },
    async readTokenCookie() {
      return (await context.cookies()).find((cookie) => cookie.name === 'payload-token')
    },
    async revoke() {
      const response = await context.request.post(
        `${serverURL}/api${AUTH_SESSION_TEST_ROUTES.REVOKE}`,
      )

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
  }
}
