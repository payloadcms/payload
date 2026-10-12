import type { BrowserContext, Page } from '@playwright/test'

import { expect, test } from '@playwright/test'
import * as path from 'path'
import { fileURLToPath } from 'url'

import { AdminUrlUtil } from '../__helpers/shared/adminUrlUtil.js'
import { initPayloadE2ENoConfig } from '../__helpers/shared/initPayloadE2ENoConfig.js'
import { initPage } from '../__setup/e2e/initPage.js'
import { devUser } from '../credentials.js'
import { TEST_TIMEOUT_LONG } from '../playwright.config.js'
import { embedCookieName, themeCookieName } from './shared.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

test.describe('embed mode', () => {
  let page: Page
  let context: BrowserContext
  let url: AdminUrlUtil

  const userMenu = () => page.locator('button[aria-label="Account"]')

  const getEmbedCookie = async () =>
    (await context.cookies()).find((cookie) => cookie.name === embedCookieName)

  test.beforeAll(async ({ browser }, testInfo) => {
    testInfo.setTimeout(TEST_TIMEOUT_LONG)

    const { serverURL } = await initPayloadE2ENoConfig({ dirname })
    url = new AdminUrlUtil(serverURL, 'users')

    context = await browser.newContext()
    ;({ page } = await initPage({ context, serverURL }))
  })

  test.afterAll(async () => {
    await context?.close()
  })

  test('should persist embed mode while keeping the local user menu available', async () => {
    // No param and no cookie: not embedded, so the UserMenu is visible.
    await page.goto(url.admin)
    await expect(userMenu()).toBeVisible()

    // Local users retain access to logout while embed mode is active.
    await page.goto(`${url.admin}?embed=true`)
    await expect(userMenu()).toBeVisible()
    await userMenu().click()
    await expect(page.getByRole('menuitem', { name: 'Log out', exact: true })).toBeVisible()
    await page.keyboard.press('Escape')

    // The cookie carries the attributes required for cross-site (iframe)
    // embedding: session-scoped, Secure, SameSite=None, and Partitioned (which
    // Playwright surfaces as `partitionKey`, keyed to the top-level site).
    // Poll, since the cookie is written by a client effect after render.
    await expect.poll(getEmbedCookie).toMatchObject({
      expires: -1, // session cookie: no Max-Age/Expires
      partitionKey: 'http://localhost',
      path: '/',
      sameSite: 'None',
      secure: true,
      value: 'true',
    })

    // Navigating to a different page without the param keeps embed mode on via the cookie.
    await page.goto(url.account)
    await expect(userMenu()).toBeVisible()

    // ?embed=false deletes the cookie and restores the UserMenu.
    await page.goto(`${url.admin}?embed=false`)
    await expect(userMenu()).toBeVisible()
    await expect.poll(getEmbedCookie).toBeUndefined()
  })

  test('applies the ?theme= param and persists it in a cookie', async () => {
    const getRenderedTheme = () =>
      page.evaluate(() => document.documentElement.getAttribute('data-theme'))

    const getThemeCookie = async () =>
      (await context.cookies()).find((cookie) => cookie.name === themeCookieName)

    // No param and no cookie: server renders the default theme.
    await page.goto(url.admin)
    expect(await getRenderedTheme()).toBe('light')
    expect(await getThemeCookie()).toBeUndefined()

    // ?theme=dark applies the theme and writes the cookie. The root layout
    // cannot see search params (same constraint documented in
    // getRequestEmbed.ts), so this is applied client-side after mount and the
    // cookie write is not immediate -- poll for both.
    await page.goto(`${url.admin}?theme=dark`)
    await expect.poll(getRenderedTheme).toBe('dark')
    await expect.poll(getThemeCookie).toMatchObject({ value: 'dark' })

    // Navigating to a different page without the param keeps the theme via the cookie.
    await page.goto(url.account)
    expect(await getRenderedTheme()).toBe('dark')

    // An invalid ?theme= value is ignored; the cookie-derived theme still applies.
    await page.goto(`${url.admin}?theme=neon`)
    expect(await getRenderedTheme()).toBe('dark')
  })

  test('should log out a locally authenticated user in embedded mode', async ({ browser }) => {
    const logoutContext = await browser.newContext({
      extraHTTPHeaders: { DisableAutologin: 'true' },
    })

    try {
      const loginResponse = await logoutContext.request.post(`${url.serverURL}/api/users/login`, {
        data: { email: devUser.email, password: devUser.password },
      })

      expect(loginResponse.ok()).toBe(true)

      const logoutPage = await logoutContext.newPage()

      await logoutPage.goto(`${url.admin}?embed=true`)
      await logoutPage.getByRole('button', { name: 'Account', exact: true }).click()
      await logoutPage.getByRole('menuitem', { name: 'Log out', exact: true }).click()
      await expect(logoutPage).toHaveURL(url.login)
      await expect(logoutPage.locator('#field-email')).toBeVisible()

      const response = await logoutContext.request.get(`${url.serverURL}/api/users/me`)

      expect(response.ok()).toBe(true)
      expect((await response.json()).user).toBeNull()
    } finally {
      await logoutContext.close()
    }
  })
})
