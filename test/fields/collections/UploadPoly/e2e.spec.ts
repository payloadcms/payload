import type { Page } from '@playwright/test'

import { expect, test } from '@playwright/test'
import { openDocDrawer } from 'helpers/e2e/toggleDocDrawer.js'
import path from 'path'
import { wait } from 'payload/shared'
import { fileURLToPath } from 'url'

import type { PayloadTestSDK } from '../../../helpers/sdk/index.js'
import type { Config } from '../../payload-types.js'

import {
  ensureCompilationIsDone,
  exactText,
  initPageConsoleErrorCatch,
  saveDocAndAssert,
} from '../../../helpers.js'
import { AdminUrlUtil } from '../../../helpers/adminUrlUtil.js'
import { initPayloadE2ENoConfig } from '../../../helpers/initPayloadE2ENoConfig.js'
import { reInitializeDB } from '../../../helpers/reInitializeDB.js'
import { POLL_TOPASS_TIMEOUT, TEST_TIMEOUT_LONG } from '../../../playwright.config.js'
import { uploadsPoly } from '../../slugs.js'

const filename = fileURLToPath(import.meta.url)
const currentFolder = path.dirname(filename)
const dirname = path.resolve(currentFolder, '../../')

const { beforeAll, beforeEach, describe } = test

let payload: PayloadTestSDK<Config>
let page: Page
let serverURL: string
// If we want to make this run in parallel: test.describe.configure({ mode: 'parallel' })
let url: AdminUrlUtil

describe('Upload polymorphic', () => {
  beforeAll(async ({ browser }, testInfo) => {
    testInfo.setTimeout(TEST_TIMEOUT_LONG)
    process.env.SEED_IN_CONFIG_ONINIT = 'false' // Makes it so the payload config onInit seed is not run. Otherwise, the seed would be run unnecessarily twice for the initial test run - once for beforeEach and once for onInit
    ;({ payload, serverURL } = await initPayloadE2ENoConfig<Config>({
      dirname,
      // prebuild,
    }))
    url = new AdminUrlUtil(serverURL, uploadsPoly)

    const context = await browser.newContext()
    page = await context.newPage()
    initPageConsoleErrorCatch(page)

    await ensureCompilationIsDone({ page, serverURL })
  })
  beforeEach(async () => {
    await reInitializeDB({
      serverURL,
      snapshotKey: 'fieldsTest',
      uploadsDir: path.resolve(dirname, './collections/Upload/uploads'),
    })

    await ensureCompilationIsDone({ page, serverURL })
  })

  test('should upload in single polymorphic field', async () => {
    await page.goto(url.create)

    const singlePolyButton = page.locator('#field-media button', {
      hasText: exactText('Create New'),
    })
    await singlePolyButton.click()

    const uploadModal = page.locator('.payload__modal-item.drawer--is-open')
    await expect(uploadModal).toBeVisible()

    await uploadModal
      .locator('.dropzone input[type="file"]')
      .setInputFiles(path.resolve(dirname, './collections/Upload/payload.jpg'))

    const saveButton = uploadModal.locator('#action-save')
    await saveButton.click()

    const mediaPill = page.locator('#field-media .pill')
    await expect(mediaPill).toBeVisible()
    await expect(mediaPill).toContainText('Upload')

    await saveDocAndAssert(page)
  })
})
