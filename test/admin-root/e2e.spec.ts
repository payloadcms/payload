import type { Page } from '@playwright/test'

import { expect, test } from '@playwright/test'
import * as path from 'path'
import { adminRoute } from 'shared.js'
import { fileURLToPath } from 'url'

import { ensureCompilationIsDone, initPageConsoleErrorCatch, login } from '../helpers.js'
import { AdminUrlUtil } from '../helpers/adminUrlUtil.js'
import { initPayloadE2ENoConfig } from '../helpers/initPayloadE2ENoConfig.js'
import { TEST_TIMEOUT_LONG } from '../playwright.config.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

test.describe('Admin Panel (Root)', () => {
  let page: Page
  let url: AdminUrlUtil

  test.beforeAll(async ({ browser }, testInfo) => {
    testInfo.setTimeout(TEST_TIMEOUT_LONG)

    const { serverURL } = await initPayloadE2ENoConfig({ dirname })
    url = new AdminUrlUtil(serverURL, 'posts', {
      admin: adminRoute,
    })

    const context = await browser.newContext()
    page = await context.newPage()
    initPageConsoleErrorCatch(page)

    await login({ page, serverURL, customRoutes: { admin: adminRoute } })

    await ensureCompilationIsDone({
      customRoutes: {
        admin: adminRoute,
      },
      page,
      serverURL,
    })
  })

  test('renders admin panel at root', async () => {
    await page.goto(url.admin)
    const pageURL = page.url()
    expect(pageURL).toBe(url.admin)
    expect(pageURL).not.toContain('/admin')
  })

  test('collection — navigates to list view', async () => {
    await page.goto(url.list)
    const pageURL = page.url()
    expect(pageURL).toContain(url.list)
    expect(pageURL).not.toContain('/admin')
  })

  test('global — navigates to edit view', async () => {
    await page.goto(url.global('menu'))
    const pageURL = page.url()
    expect(pageURL).toBe(url.global('menu'))
    expect(pageURL).not.toContain('/admin')
  })

  test('ui - should render default payload favicons', async () => {
    await page.goto(url.admin)
    const favicons = page.locator('link[rel="icon"]')
    await expect(favicons).toHaveCount(2)
    await expect(favicons.nth(0)).toHaveAttribute('sizes', '32x32')
    await expect(favicons.nth(1)).toHaveAttribute('sizes', '32x32')
    await expect(favicons.nth(1)).toHaveAttribute('media', '(prefers-color-scheme: dark)')
    await expect(favicons.nth(1)).toHaveAttribute('href', /\/payload-favicon-light\.[a-z\d]+\.png/)
  })
})
