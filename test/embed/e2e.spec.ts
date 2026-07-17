import type { BrowserContext, Page } from '@playwright/test'

import { expect, test } from '@playwright/test'
import * as path from 'path'
import { fileURLToPath } from 'url'

import { ensureCompilationIsDone, initPageConsoleErrorCatch } from '../__helpers/e2e/helpers.js'
import { AdminUrlUtil } from '../__helpers/shared/adminUrlUtil.js'
import { initPayloadE2ENoConfig } from '../__helpers/shared/initPayloadE2ENoConfig.js'
import { TEST_TIMEOUT_LONG } from '../playwright.config.js'
import { embedCookieName } from './shared.js'

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
    page = await context.newPage()
    initPageConsoleErrorCatch(page)

    await ensureCompilationIsDone({ page, serverURL })
  })

  test('toggles embed mode via the ?embed param and persists it in a cookie', async () => {
    // No param and no cookie: not embedded, so the UserMenu is visible.
    await page.goto(url.admin)
    await expect(userMenu()).toBeVisible()

    // ?embed=true enters embed mode, hiding the UserMenu and writing the cookie.
    await page.goto(`${url.admin}?embed=true`)
    await expect(userMenu()).toBeHidden()

    // The cookie carries the attributes required for cross-site (iframe)
    // embedding: session-scoped, Secure, SameSite=None, and Partitioned (which
    // Playwright surfaces as `partitionKey`, keyed to the top-level site).
    // Poll, since the cookie is written by a client effect after render.
    await expect.poll(getEmbedCookie).toMatchObject({
      value: 'true',
      expires: -1, // session cookie: no Max-Age/Expires
      partitionKey: 'http://localhost',
      path: '/',
      sameSite: 'None',
      secure: true,
    })

    // Navigating to a different page without the param keeps embed mode on via the cookie.
    await page.goto(url.account)
    await expect(userMenu()).toBeHidden()

    // ?embed=false deletes the cookie and restores the UserMenu.
    await page.goto(`${url.admin}?embed=false`)
    await expect(userMenu()).toBeVisible()
    await expect.poll(getEmbedCookie).toBeUndefined()
  })
})
