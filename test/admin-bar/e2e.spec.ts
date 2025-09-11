import type { Page } from '@playwright/test'

import { expect, test } from '@playwright/test'
import * as path from 'path'
import { fileURLToPath } from 'url'

import { ensureCompilationIsDone, initPageConsoleErrorCatch } from '../helpers.js'
import { AdminUrlUtil } from '../helpers/adminUrlUtil.js'
import { initPayloadE2ENoConfig } from '../helpers/initPayloadE2ENoConfig.js'
import { TEST_TIMEOUT_LONG } from '../playwright.config.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

test.describe('Admin Bar', () => {
  let page: Page
  let url: AdminUrlUtil
  let serverURL: string

  test.beforeAll(async ({ browser }, testInfo) => {
    testInfo.setTimeout(TEST_TIMEOUT_LONG)

    const { payload, serverURL: incomingServerURL } = await initPayloadE2ENoConfig({ dirname })
    url = new AdminUrlUtil(incomingServerURL, 'posts')
    serverURL = incomingServerURL

    const context = await browser.newContext()
    page = await context.newPage()
    initPageConsoleErrorCatch(page)
    await ensureCompilationIsDone({ page, serverURL: incomingServerURL })
  })

  test('should render admin bar', async () => {
    await page.goto(`${serverURL}/admin-bar`)
    await expect(page.locator('#payload-admin-bar')).toBeVisible()
  })
})
