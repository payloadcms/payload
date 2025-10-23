import type { Page } from '@playwright/test'
import type { CollectionSlug } from 'payload'

import { expect, test } from '@playwright/test'
import path from 'path'
import { fileURLToPath } from 'url'

import type { PayloadTestSDK } from '../helpers/sdk/index.js'
import type { Config } from './payload-types.js'

import { ensureCompilationIsDone, initPageConsoleErrorCatch, saveDocAndAssert } from '../helpers.js'
import { AdminUrlUtil } from '../helpers/adminUrlUtil.js'
import { initPayloadE2ENoConfig } from '../helpers/initPayloadE2ENoConfig.js'
import { TEST_TIMEOUT_LONG } from '../playwright.config.js'
import { beforeValidateSlug } from './shared.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const { beforeAll, beforeEach, describe } = test

let payload: PayloadTestSDK<Config>

describe('Hooks', () => {
  let url: AdminUrlUtil
  let beforeChangeURL: AdminUrlUtil
  let page: Page
  let serverURL: string

  beforeAll(async ({ browser }, testInfo) => {
    testInfo.setTimeout(TEST_TIMEOUT_LONG)
    ;({ payload, serverURL } = await initPayloadE2ENoConfig<Config>({ dirname }))

    url = new AdminUrlUtil(serverURL, 'before-validate')
    beforeChangeURL = new AdminUrlUtil(serverURL, 'before-change-hooks')

    const context = await browser.newContext()
    page = await context.newPage()

    initPageConsoleErrorCatch(page)
    await ensureCompilationIsDone({ page, serverURL })
  })

  beforeEach(async () => {
    await ensureCompilationIsDone({ page, serverURL })

    await clearAllDocs()
  })

  test('should replace value with before validate response', async () => {
    await page.goto(url.create)
    await page.locator('#field-title').fill('should replace value with before validate response')
    await saveDocAndAssert(page)

    await expect(page.locator('#field-title')).toHaveValue('reset in beforeValidate')
    await page
      .locator('#field-title')
      .fill('should replace value with before validate response again')
    await saveDocAndAssert(page)

    await expect(page.locator('#field-title')).toHaveValue('reset in beforeValidate')
  })

  test('should reflect changes made in beforeChange collection hooks within ui after save', async () => {
    await page.goto(beforeChangeURL.create)
    await page.locator('#field-title').fill('should replace value with before change response')
    await saveDocAndAssert(page)

    await expect(page.locator('#field-title')).toHaveValue('hi from hook')
    await page.locator('#field-title').fill('helllooooooooo')
    await saveDocAndAssert(page)

    await expect(page.locator('#field-title')).toHaveValue('hi from hook')
  })
})

async function clearAllDocs(): Promise<void> {
  await clearCollectionDocs(beforeValidateSlug)
}

async function clearCollectionDocs(collectionSlug: CollectionSlug): Promise<void> {
  await payload.delete({
    collection: collectionSlug,
    where: {
      id: { exists: true },
    },
  })
}
