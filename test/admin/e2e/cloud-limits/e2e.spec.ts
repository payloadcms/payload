import type { Page } from '@playwright/test'

import { expect } from '@playwright/test'

import type { Config } from '../../payload-types.js'

import {
  ensureCompilationIsDone,
  initPageConsoleErrorCatch,
} from '../../../__helpers/e2e/helpers.js'
import { test } from '../../../__helpers/e2e/playwright.js'
import { AdminUrlUtil } from '../../../__helpers/shared/adminUrlUtil.js'
import { initPayloadE2ENoConfig } from '../../../__helpers/shared/initPayloadE2ENoConfig.js'
import { cloudLimitTriggers } from '../../collections/CloudLimits/index.js'
import { BASE_PATH, customAdminRoutes } from '../../shared.js'
import { cloudLimitsAutosaveCollectionSlug, cloudLimitsCollectionSlug } from '../../slugs.js'

process.env.NEXT_BASE_PATH = BASE_PATH

const { beforeAll, beforeEach, describe } = test

import path from 'path'
import { fileURLToPath } from 'url'

import { reInitializeDB } from '../../../__helpers/shared/clearAndSeed/reInitializeDB.js'
import { TEST_TIMEOUT_LONG } from '../../../playwright.config.js'

const filename = fileURLToPath(import.meta.url)
const currentFolder = path.dirname(filename)
const dirname = path.resolve(currentFolder, '../../')

const reviewLink = '.cloud-limit-modal__review-link'
const toastContainer = '.payload-toast-container'
const infoToast = `${toastContainer} .toast-info`
const errorToast = `${toastContainer} .toast-error`

describe('Cloud limits', () => {
  let page: Page
  let serverURL: string
  let cloudLimitsURL: AdminUrlUtil
  let cloudLimitsAutosaveURL: AdminUrlUtil

  beforeAll(async ({ browser }, testInfo) => {
    testInfo.setTimeout(TEST_TIMEOUT_LONG)
    process.env.SEED_IN_CONFIG_ONINIT = 'false'
    ;({ serverURL } = await initPayloadE2ENoConfig<Config>({ dirname }))

    cloudLimitsURL = new AdminUrlUtil(serverURL, cloudLimitsCollectionSlug)
    cloudLimitsAutosaveURL = new AdminUrlUtil(serverURL, cloudLimitsAutosaveCollectionSlug)

    const context = await browser.newContext()
    page = await context.newPage()
    initPageConsoleErrorCatch(page)

    await ensureCompilationIsDone({ customAdminRoutes, page, serverURL })
  })

  beforeEach(async () => {
    await reInitializeDB({
      serverURL,
      snapshotKey: 'adminTests',
    })

    await ensureCompilationIsDone({ customAdminRoutes, page, serverURL })
  })

  test('should show the document-count modal on save when autosave is disabled', async () => {
    await page.goto(cloudLimitsURL.create)
    await page.locator('#field-title').fill(cloudLimitTriggers.documentCount.title)
    await page.click('#action-save', { delay: 100 })

    // The review link is unique to this modal; the slug is depth-scoped so avoid matching on it.
    await expect(page.locator(reviewLink)).toBeVisible()
    await expect(page.getByText('You have reached your document limit')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Retry' })).toBeVisible()

    // The bespoke modal replaces the generic error toast.
    await expect(page.locator(errorToast)).toBeHidden()
  })

  test('should re-attempt the save when clicking Retry in the document-count modal', async () => {
    await page.goto(cloudLimitsURL.create)
    await page.locator('#field-title').fill(cloudLimitTriggers.documentCount.title)
    await page.click('#action-save', { delay: 100 })

    await expect(page.locator(reviewLink)).toBeVisible()
    await page.getByRole('button', { name: 'Retry' }).click()

    // The title still exceeds the limit, so retrying re-triggers the error and the modal returns.
    await expect(page.locator(reviewLink)).toBeVisible()
  })

  test('should show a neutral toast for the per-document data-size limit', async () => {
    await page.goto(cloudLimitsURL.create)
    await page.locator('#field-title').fill(cloudLimitTriggers.documentDataSize.title)
    await page.click('#action-save', { delay: 100 })

    await expect(page.locator(infoToast)).toContainText(
      'Unable to save document, text is too large',
    )
    await expect(page.locator(errorToast)).toBeHidden()
    await expect(page.locator(reviewLink)).toBeHidden()
  })

  test('should show a neutral toast for the asset-storage limit', async () => {
    await page.goto(cloudLimitsURL.create)
    await page.locator('#field-title').fill(cloudLimitTriggers.assetStorage.title)
    await page.click('#action-save', { delay: 100 })

    await expect(page.locator(infoToast)).toContainText(
      'Unable to upload. Free up space to continue.',
    )
    await expect(page.locator(errorToast)).toBeHidden()
  })

  test('should show a toast instead of the modal for the document-count limit when autosave is enabled', async () => {
    await page.goto(cloudLimitsAutosaveURL.create)

    // Autosave fires on change, so no explicit save action is needed.
    await page.locator('#field-title').fill(cloudLimitTriggers.documentCount.title)

    await expect(page.locator(infoToast)).toContainText(
      'Unable to create document. Storage limit reached.',
    )
    await expect(page.locator(reviewLink)).toBeHidden()
  })
})
