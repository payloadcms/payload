import type { Page } from '@playwright/test'

import { expect, test } from '@playwright/test'
import * as path from 'path'
import { fileURLToPath } from 'url'

import { ensureCompilationIsDone, initPageConsoleErrorCatch } from '../helpers.js'
import { AdminUrlUtil } from '../helpers/adminUrlUtil.js'
import { navigateToDoc } from '../helpers/e2e/navigateToDoc.js'
import { initPayloadE2ENoConfig } from '../helpers/initPayloadE2ENoConfig.js'
import { TEST_TIMEOUT_LONG } from '../playwright.config.js'
import { categoriesSlug, postsSlug } from './shared.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

test.describe('Admin Panel', () => {
  let page: Page
  let categoriesURL: AdminUrlUtil
  let postsURL: AdminUrlUtil

  test.beforeAll(async ({ browser }, testInfo) => {
    testInfo.setTimeout(TEST_TIMEOUT_LONG)

    const { payload, serverURL } = await initPayloadE2ENoConfig({ dirname })
    postsURL = new AdminUrlUtil(serverURL, postsSlug)
    categoriesURL = new AdminUrlUtil(serverURL, categoriesSlug)

    const context = await browser.newContext()
    page = await context.newPage()
    initPageConsoleErrorCatch(page)
    await ensureCompilationIsDone({ page, serverURL })
  })

  test('renders join field with initial rows', async () => {
    await navigateToDoc(page, categoriesURL)
    const joinField = page.locator('.field-type.join').first()
    await expect(joinField).toBeVisible()
    const columns = await joinField.locator('.relationship-table tbody tr').count()
    expect(columns).toBe(3)
  })
})
