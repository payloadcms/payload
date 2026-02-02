import type { Page } from '@playwright/test'

import { expect, test } from '@playwright/test'
import path from 'path'
import { fileURLToPath } from 'url'

import {
  ensureCompilationIsDone,
  initPageConsoleErrorCatch,
  saveDocAndAssert,
} from '../helpers/e2e/helpers.js'
import { AdminUrlUtil } from '../helpers/shared/adminUrlUtil.js'
import { goToListDoc } from '../helpers/e2e/goToListDoc.js'
import { initPayloadE2ENoConfig } from '../helpers/shared/initPayloadE2ENoConfig.js'
import { TEST_TIMEOUT_LONG } from '../playwright.config.js'
import { BASE_PATH } from './shared.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

process.env.NEXT_BASE_PATH = BASE_PATH

test.describe('Base Path', () => {
  let page: Page
  let url: AdminUrlUtil
  let serverURL: string

  test.beforeAll(async ({ browser }, testInfo) => {
    testInfo.setTimeout(TEST_TIMEOUT_LONG)

    const { payload } = await initPayloadE2ENoConfig({
      dirname,
    })
    serverURL = payload.serverURL
    url = new AdminUrlUtil(serverURL, 'posts')

    const context = await browser.newContext()
    page = await context.newPage()
    initPageConsoleErrorCatch(page)

    await ensureCompilationIsDone({
      page,
      serverURL,
    })
  })

  test('should navigate to posts collection by clicking nav link', async () => {
    // Navigate to the admin dashboard
    await page.goto(url.admin)

    // click first dashboard card
    await page.locator('.dashboard__card-list .card').first().click()

    // should navigate to basePath url
    await expect.poll(() => page.url()).toContain('/cms/admin/collections/posts')

    await goToListDoc({
      cellClass: '.cell-title',
      page,
      textToMatch: 'First Post',
      urlUtil: url,
    })

    const docID = (await page.locator('.render-title').getAttribute('data-doc-id')) as string
    // should navigate to edit view with basePath url
    await expect.poll(() => page.url()).toContain(`/cms/admin/collections/posts/${docID}`)

    await page.locator('#field-title').fill('First Post Edited')
    await saveDocAndAssert(page)
  })

  test('should navigate to create new post by clicking button', async () => {
    // Navigate to posts list
    await page.goto(url.list)

    // Click the "Create New" button
    const createButton = page.locator('a[href*="/posts/create"]').first()
    await expect(createButton).toBeVisible()
    await createButton.click()

    // Verify we navigated to the create view
    await expect.poll(() => page.url()).toContain('/posts/create')

    // Verify the form is rendered
    await expect(page.locator('#field-title')).toBeVisible()
  })
})
