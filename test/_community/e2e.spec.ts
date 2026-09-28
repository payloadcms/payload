import type { Page } from '@playwright/test'

import { expect, test } from '@playwright/test'
import * as path from 'path'
import { fileURLToPath } from 'url'

import { AdminUrlUtil } from '../__helpers/shared/adminUrlUtil.js'
import { initPayloadE2ENoConfig } from '../__helpers/shared/initPayloadE2ENoConfig.js'
import { initPage } from '../__setup/e2e/initPage.js'
import { TEST_TIMEOUT_LONG } from '../playwright.config.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

test.describe('Community', () => {
  let articleURL: AdminUrlUtil
  let page: Page
  let url: AdminUrlUtil

  test.beforeAll(async ({ browser }, testInfo) => {
    testInfo.setTimeout(TEST_TIMEOUT_LONG)

    const { serverURL } = await initPayloadE2ENoConfig({ dirname })
    articleURL = new AdminUrlUtil(serverURL, 'articles')
    url = new AdminUrlUtil(serverURL, 'posts')

    const context = await browser.newContext()
    ;({ page } = await initPage({ context, serverURL }))
  })

  test('example test', async () => {
    await page.goto(url.list)

    const textCell = page.locator('.cell-title').filter({ hasText: 'example post' })
    await expect(textCell).toHaveText('example post')
  })

  test('should show the fixed toolbar on the article body', async () => {
    await page.goto(articleURL.list)
    await page.locator('.cell-title').filter({ hasText: 'Notes from the ridgeline' }).click()

    await expect(page.locator('.rich-text-lexical .fixed-toolbar')).toBeVisible()
  })
})
