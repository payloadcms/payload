import type { Page } from '@playwright/test'

import { expect, test } from '@playwright/test'
import { openDocDrawer } from '__helpers/e2e/toggleDocDrawer.js'
import path from 'path'
import { wait } from 'payload/shared'
import { fileURLToPath } from 'url'

import type { PayloadTestSDK } from '../../../__helpers/shared/sdk/index.js'
import type { Config } from '../../payload-types.js'

import {
  ensureCompilationIsDone,
  exactText,
  initPageConsoleErrorCatch,
  saveDocAndAssert,
} from '../../../__helpers/e2e/helpers.js'
import { AdminUrlUtil } from '../../../__helpers/shared/adminUrlUtil.js'
import { initPayloadE2ENoConfig } from '../../../__helpers/shared/initPayloadE2ENoConfig.js'
import { reInitializeDB } from '../../../__helpers/shared/clearAndSeed/reInitializeDB.js'
import { POLL_TOPASS_TIMEOUT, TEST_TIMEOUT_LONG } from '../../../playwright.config.js'
import { uploadsMulti } from '../../slugs.js'

const filename = fileURLToPath(import.meta.url)
const currentFolder = path.dirname(filename)
const dirname = path.resolve(currentFolder, '../../')

const { beforeAll, beforeEach, describe } = test

let payload: PayloadTestSDK<Config>
let page: Page
let serverURL: string
// If we want to make this run in parallel: test.describe.configure({ mode: 'parallel' })
let url: AdminUrlUtil

describe('Upload with hasMany', () => {
  beforeAll(async ({ browser }, testInfo) => {
    testInfo.setTimeout(TEST_TIMEOUT_LONG)
    process.env.SEED_IN_CONFIG_ONINIT = 'false' // Makes it so the payload config onInit seed is not run. Otherwise, the seed would be run unnecessarily twice for the initial test run - once for beforeEach and once for onInit
    ;({ payload, serverURL } = await initPayloadE2ENoConfig<Config>({
      dirname,
      // prebuild,
    }))
    url = new AdminUrlUtil(serverURL, uploadsMulti)

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

  test('should upload in new doc', async () => {
    await page.goto(url.create)

    const multiButton = page.locator('#field-media button', {
      hasText: exactText('Create New'),
    })
    await multiButton.click()

    const uploadModal = page.locator('#media-bulk-upload-drawer-slug-1')
    await expect(uploadModal).toBeVisible()

    await uploadModal
      .locator('.dropzone input[type="file"]')
      .setInputFiles(path.resolve(dirname, './collections/Upload/payload.jpg'))

    const saveButton = uploadModal.locator('.bulk-upload--actions-bar__saveButtons button')
    await saveButton.click()

    const firstFileInList = page.locator('.upload-field-card').first()
    await expect(firstFileInList.locator('.upload-relationship-details__filename')).toBeVisible()

    await multiButton.click()
    await expect(uploadModal).toBeVisible()
    await page.setInputFiles(
      'input[type="file"]',
      path.resolve(dirname, './collections/Upload/payload.jpg'),
    )
    await saveButton.click()

    await saveDocAndAssert(page)
  })

  test('can insert new media with existing values', async () => {
    await page.goto(url.list)

    const firstItem = page.locator('.cell-id').first().locator('a')

    await firstItem.click()

    const multiButton = page.locator('#field-media button', {
      hasText: exactText('Create New'),
    })

    await multiButton.click()

    const uploadModal = page.locator('#media-bulk-upload-drawer-slug-1')
    await expect(uploadModal).toBeVisible()

    await uploadModal
      .locator('.dropzone input[type="file"]')
      .setInputFiles(path.resolve(dirname, './collections/Upload/payload.jpg'))

    const saveButton = uploadModal.locator('.bulk-upload--actions-bar__saveButtons button')
    await saveButton.click()

    const firstFileInList = page.locator('.upload-field-card').first()
    await expect(firstFileInList.locator('.upload-relationship-details__filename')).toBeVisible()

    await page
      .locator('#field-media button', {
        hasText: exactText('Create New'),
      })
      .first()
      .click()
    await expect(uploadModal).toBeVisible()
    await page.setInputFiles(
      'input[type="file"]',
      path.resolve(dirname, './collections/Upload/payload.jpg'),
    )
    await saveButton.click()

    await saveDocAndAssert(page)
  })
})
