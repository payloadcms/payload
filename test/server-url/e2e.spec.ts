import type { Page } from '@playwright/test'

import { expect, test } from '@playwright/test'
import { login } from 'helpers/e2e/auth/login.js'
import { logoutViaNav } from 'helpers/e2e/auth/logout.js'
import * as path from 'path'
import { fileURLToPath } from 'url'

import { ensureCompilationIsDone, initPageConsoleErrorCatch } from '../__helpers/e2e/helpers.js'
import { AdminUrlUtil } from '../__helpers/shared/adminUrlUtil.js'
import { initPayloadE2ENoConfig } from '../__helpers/shared/initPayloadE2ENoConfig.js'
import { TEST_TIMEOUT_LONG } from '../playwright.config.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

test.describe('serverURL', () => {
  let page: Page
  let url: AdminUrlUtil

  test.beforeAll(async ({ browser }, testInfo) => {
    testInfo.setTimeout(TEST_TIMEOUT_LONG)

    const { payload, serverURL } = await initPayloadE2ENoConfig({ dirname })
    url = new AdminUrlUtil(serverURL, 'posts')

    const context = await browser.newContext()
    page = await context.newPage()
    initPageConsoleErrorCatch(page)
    await ensureCompilationIsDone({ page, serverURL })
  })

  test('can load admin panel', async () => {
    await login({ page, serverURL: url.serverURL })
    await page.goto(url.admin)
    await expect(page.locator('.dashboard')).toBeVisible()
  })

  test('can log out', async () => {
    await page.goto(url.admin)
    await logoutViaNav(page)
    await expect(page.locator('.login')).toBeVisible()
  })
})
