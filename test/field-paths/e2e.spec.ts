import type { BrowserContext, Page } from '@playwright/test'
import type { PayloadTestSDK } from 'helpers/sdk/index.js'

import { expect, test } from '@playwright/test'
import { navigateToDiffVersionView } from 'helpers/e2e/navigateToDiffVersionView.js'
import * as path from 'path'
import { wait } from 'payload/shared'
import { fileURLToPath } from 'url'

import type { Config } from './payload-types.js'

import {
  ensureCompilationIsDone,
  initPageConsoleErrorCatch,
  // throttleTest,
} from '../helpers.js'
import { AdminUrlUtil } from '../helpers/adminUrlUtil.js'
import { initPayloadE2ENoConfig } from '../helpers/initPayloadE2ENoConfig.js'
import { TEST_TIMEOUT_LONG } from '../playwright.config.js'
import { fieldPathsSlug } from './shared.js'
import { testDoc } from './testDoc.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

let context: BrowserContext
let payload: PayloadTestSDK<Config>
let serverURL: string

test.describe('Field Paths', () => {
  let page: Page
  let fieldPathsUrl: AdminUrlUtil

  test.beforeAll(async ({ browser }, testInfo) => {
    testInfo.setTimeout(TEST_TIMEOUT_LONG)
    ;({ payload, serverURL } = await initPayloadE2ENoConfig({ dirname }))
    fieldPathsUrl = new AdminUrlUtil(serverURL, fieldPathsSlug)

    context = await browser.newContext()
    page = await context.newPage()
    initPageConsoleErrorCatch(page)
    await ensureCompilationIsDone({ page, serverURL })
  })

  test.beforeEach(async () => {
    // await throttleTest({ page, context, delay: 'Fast 3G' })
  })

  test('can load document view', async () => {
    const { id: docID } = await payload.create({
      collection: fieldPathsSlug,
      data: testDoc,
    })

    await page.goto(fieldPathsUrl.edit(docID))

    await expect(page.locator('.render-fields').first()).toBeVisible()
  })

  test('can load versions diff view', async () => {
    const { id: docID } = await payload.create({
      collection: fieldPathsSlug,
      data: testDoc,
    })

    await navigateToDiffVersionView({
      page,
      docID,
      collectionSlug: fieldPathsSlug,
      serverURL,
    })

    await expect(page.locator('.render-field-diffs').first()).toBeVisible()
  })
})
