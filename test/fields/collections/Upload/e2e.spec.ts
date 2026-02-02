import type { Page } from '@playwright/test'

import { expect, test } from '@playwright/test'
import { checkFocusIndicators } from '__helpers/e2e/checkFocusIndicators.js'
import { runAxeScan } from '__helpers/e2e/runAxeScan.js'
import { openDocDrawer } from '__helpers/e2e/toggleDocDrawer.js'
import path from 'path'
import { wait } from 'payload/shared'
import { fileURLToPath } from 'url'

import type { PayloadTestSDK } from '../../../__helpers/shared/sdk/index.js'
import type { Config } from '../../payload-types.js'

import {
  ensureCompilationIsDone,
  initPageConsoleErrorCatch,
  saveDocAndAssert,
} from '../../../__helpers/e2e/helpers.js'
import { AdminUrlUtil } from '../../../__helpers/shared/adminUrlUtil.js'
import { initPayloadE2ENoConfig } from '../../../__helpers/shared/initPayloadE2ENoConfig.js'
import { reInitializeDB } from '../../../__helpers/shared/clearAndSeed/reInitializeDB.js'
import { POLL_TOPASS_TIMEOUT, TEST_TIMEOUT_LONG } from '../../../playwright.config.js'
import { uploadsSlug } from '../../slugs.js'

const filename = fileURLToPath(import.meta.url)
const currentFolder = path.dirname(filename)
const dirname = path.resolve(currentFolder, '../../')

const { beforeAll, beforeEach, describe } = test

let payload: PayloadTestSDK<Config>
let page: Page
let serverURL: string
// If we want to make this run in parallel: test.describe.configure({ mode: 'parallel' })
let url: AdminUrlUtil

describe('Upload', () => {
  beforeAll(async ({ browser }, testInfo) => {
    testInfo.setTimeout(TEST_TIMEOUT_LONG)
    process.env.SEED_IN_CONFIG_ONINIT = 'false' // Makes it so the payload config onInit seed is not run. Otherwise, the seed would be run unnecessarily twice for the initial test run - once for beforeEach and once for onInit
    ;({ payload, serverURL } = await initPayloadE2ENoConfig<Config>({
      dirname,
      // prebuild,
    }))
    url = new AdminUrlUtil(serverURL, uploadsSlug)

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

  async function uploadImage() {
    await page.goto(url.create)

    // create a jpg upload
    await page
      .locator('.file-field__upload input[type="file"]')
      .setInputFiles(path.resolve(dirname, './collections/Upload/payload.jpg'))
    await expect(page.locator('.file-field .file-field__filename')).toHaveValue('payload.jpg')
    await saveDocAndAssert(page)
  }

  test('should upload files', async () => {
    await uploadImage()
  })

  test('should upload files from remote URL', async () => {
    await page.goto(url.create)

    const pasteURLButton = page.locator('.file-field__upload button', {
      hasText: 'Paste URL',
    })
    await pasteURLButton.click()

    const remoteImage =
      'https://raw.githubusercontent.com/payloadcms/website/refs/heads/main/public/images/og-image.jpg'

    const inputField = page.locator('.file-field__upload .file-field__remote-file')
    await inputField.fill(remoteImage)

    const addFileButton = page.locator('.file-field__add-file')
    await addFileButton.click()

    await expect(page.locator('.file-field .file-field__filename')).toHaveValue('og-image.jpg')

    await saveDocAndAssert(page)

    await expect(page.locator('.file-field .file-details img')).toHaveAttribute(
      'src',
      /\/api\/uploads\/file\/og-image\.jpg(\?.*)?$/,
    )
  })

  test('should disable save button during upload progress from remote URL', async () => {
    await page.goto(url.create)

    const pasteURLButton = page.locator('.file-field__upload button', {
      hasText: 'Paste URL',
    })
    await pasteURLButton.click()

    const remoteImage =
      'https://raw.githubusercontent.com/payloadcms/website/refs/heads/main/public/images/og-image.jpg'

    const inputField = page.locator('.file-field__upload .file-field__remote-file')
    await inputField.fill(remoteImage)

    // Intercept the upload request
    await page.route(
      'https://raw.githubusercontent.com/payloadcms/website/refs/heads/main/public/images/og-image.jpg',
      (route) => setTimeout(() => route.continue(), 2000), // Artificial 2-second delay
    )

    const addFileButton = page.locator('.file-field__add-file')
    await addFileButton.click()

    const submitButton = page.locator('.form-submit .btn')
    await expect(submitButton).toBeDisabled()

    // Wait for the upload to complete
    await page.waitForResponse(
      'https://raw.githubusercontent.com/payloadcms/website/refs/heads/main/public/images/og-image.jpg',
    )

    // Assert the submit button is re-enabled after upload
    await expect(submitButton).toBeEnabled()
  })

  // test that the image renders
  test('should render uploaded image', async () => {
    await uploadImage()
    await expect(page.locator('.file-field .file-details img')).toHaveAttribute(
      'src',
      /\/api\/uploads\/file\/payload-1\.jpg(\?.*)?$/,
    )
  })

  test('should upload using the document drawer', async () => {
    await uploadImage()
    await wait(1000)
    // Open the media drawer and create a png upload

    await openDocDrawer({ page, selector: '#field-media .upload__createNewToggler' })

    await page
      .locator('[id^=doc-drawer_uploads_1_] .file-field__upload input[type="file"]')
      .setInputFiles(path.resolve(dirname, './uploads/payload.png'))

    await expect(
      page.locator('[id^=doc-drawer_uploads_1_] .file-field__upload .file-field__filename'),
    ).toHaveValue('payload.png')

    await page.locator('[id^=doc-drawer_uploads_1_] #action-save').click()
    await expect(page.locator('.payload-toast-container')).toContainText('successfully')

    // Assert that the media field has the png upload
    await expect(
      page.locator('.field-type.upload .upload-relationship-details__filename a'),
    ).toHaveAttribute('href', '/api/uploads/file/payload-1.png')

    await expect(
      page.locator('.field-type.upload .upload-relationship-details__filename a'),
    ).toContainText('payload-1.png')

    await expect(
      page.locator('.field-type.upload .upload-relationship-details img'),
    ).toHaveAttribute('src', /\/api\/uploads\/file\/payload-1\.png(\?.*)?$/)
    await saveDocAndAssert(page)
  })

  test('should upload after editing image inside a document drawer', async () => {
    await uploadImage()
    await wait(1000)
    // Open the media drawer and create a png upload

    await openDocDrawer({ page, selector: '#field-media .upload__createNewToggler' })

    await page
      .locator('[id^=doc-drawer_uploads_1_] .file-field__upload input[type="file"]')
      .setInputFiles(path.resolve(dirname, './uploads/payload.png'))
    await expect(
      page.locator('[id^=doc-drawer_uploads_1_] .file-field__upload .file-field__filename'),
    ).toHaveValue('payload.png')
    await page.locator('[id^=doc-drawer_uploads_1_] .file-field__edit').click()
    await page
      .locator('[id^=edit-upload] .edit-upload__input input[name="Width (px)"]')
      .nth(1)
      .fill('200')
    await page
      .locator('[id^=edit-upload] .edit-upload__input input[name="Height (px)"]')
      .nth(1)
      .fill('200')
    await page.locator('[id^=edit-upload] button:has-text("Apply Changes")').nth(1).click()
    await page.locator('[id^=doc-drawer_uploads_1_] #action-save').click()
    await expect(page.locator('.payload-toast-container')).toContainText('successfully')

    // Assert that the media field has the png upload
    await expect(
      page.locator('.field-type.upload .upload-relationship-details__filename a'),
    ).toHaveAttribute('href', '/api/uploads/file/payload-1.png')
    await expect(
      page.locator('.field-type.upload .upload-relationship-details__filename a'),
    ).toContainText('payload-1.png')
    await expect(
      page.locator('.field-type.upload .upload-relationship-details img'),
    ).toHaveAttribute('src', /\/api\/uploads\/file\/payload-1\.png(\?.*)?$/)
    await saveDocAndAssert(page)
  })

  test('should clear selected upload', async () => {
    await uploadImage()
    await wait(1000) // TODO: Fix this. Need to wait a bit until the form in the drawer mounted, otherwise values sometimes disappear. This is an issue for all drawers

    await openDocDrawer({ page, selector: '#field-media .upload__createNewToggler' })

    await wait(1000)

    await page
      .locator('[id^=doc-drawer_uploads_1_] .file-field__upload input[type="file"]')
      .setInputFiles(path.resolve(dirname, './uploads/payload.png'))
    await expect(
      page.locator('[id^=doc-drawer_uploads_1_] .file-field__upload .file-field__filename'),
    ).toHaveValue('payload.png')
    await page.locator('[id^=doc-drawer_uploads_1_] #action-save').click()
    await expect(page.locator('.payload-toast-container')).toContainText('successfully')
    await page.locator('.field-type.upload .upload-relationship-details__remove').click()
  })

  test('should select using the list drawer and restrict mimetype based on filterOptions', async () => {
    await uploadImage()

    await openDocDrawer({ page, selector: '.field-type.upload .upload__listToggler' })

    const jpgImages = page.locator('[id^=list-drawer_1_] .upload-gallery img[src$=".jpg"]')
    await expect
      .poll(async () => await jpgImages.count(), { timeout: POLL_TOPASS_TIMEOUT })
      .toEqual(0)
  })

  test.skip('should show drawer for input field when enableRichText is false', async () => {
    const uploads3URL = new AdminUrlUtil(serverURL, 'uploads3')
    await page.goto(uploads3URL.create)

    // create file in uploads 3 collection
    await page
      .locator('.file-field__upload input[type="file"]')
      .setInputFiles(path.resolve(dirname, './collections/Upload/payload.jpg'))
    await expect(page.locator('.file-field .file-field__filename')).toContainText('payload.jpg')
    await page.locator('#action-save').click()

    await wait(200)

    // open drawer
    await openDocDrawer({ page, selector: '.field-type.upload .list-drawer__toggler' })
    // check title
    await expect(page.locator('.list-drawer__header-text')).toContainText('Uploads 3')
  })

  describe('A11y', () => {
    test.fixme('Create view should have no accessibility violations', async ({}, testInfo) => {
      await page.goto(url.create)
      await page.locator('#field-text').waitFor()

      const scanResults = await runAxeScan({
        page,
        testInfo,
        include: ['.collection-edit__main'],
        exclude: ['.field-description'], // known issue - reported elsewhere @todo: remove this once fixed - see report https://github.com/payloadcms/payload/discussions/14489
      })

      expect(scanResults.violations.length).toBe(0)
    })

    test.fixme('Edit view should have no accessibility violations', async ({}, testInfo) => {
      await page.goto(url.list)
      const firstItem = page.locator('.cell-filename a').nth(0)
      await firstItem.click()

      await page.locator('#field-text').waitFor()

      const scanResults = await runAxeScan({
        page,
        testInfo,
        include: ['.collection-edit__main'],
        exclude: ['.field-description'], // known issue - reported elsewhere @todo: remove this once fixed - see report https://github.com/payloadcms/payload/discussions/14489
      })

      expect(scanResults.violations.length).toBe(0)
    })

    test('Upload fields have focus indicators', async ({}, testInfo) => {
      await page.goto(url.create)
      await page.locator('#field-text').waitFor()

      const scanResults = await checkFocusIndicators({
        page,
        testInfo,
        selector: '.collection-edit__main',
      })

      expect(scanResults.totalFocusableElements).toBeGreaterThan(0)
      expect(scanResults.elementsWithoutIndicators).toBe(0)
    })
  })
})
