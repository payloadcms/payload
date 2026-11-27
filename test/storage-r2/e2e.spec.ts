import type { Page } from '@playwright/test'

import { expect, test } from '@playwright/test'
import { statSync } from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

import { exactText, gotoAndWaitForForm, saveDocAndAssert } from '../__helpers/e2e/helpers.js'
import { AdminUrlUtil } from '../__helpers/shared/adminUrlUtil.js'
import { initPayloadE2ENoConfig } from '../__helpers/shared/initPayloadE2ENoConfig.js'
import { ensureCompilationIsDone } from '../__setup/e2e/ensureCompilationIsDone.js'
import { TEST_TIMEOUT_LONG } from '../playwright.config.js'
import { mediaClientSlug, mediaContainerSlug } from './shared.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const multipartEndpoint = '/api/storage-r2-multi-part-upload'
const imagePath = path.resolve(dirname, '../uploads/image.png')
const secondImagePath = path.resolve(dirname, '../uploads/test-image.png')
// Admin form-state and access requests stay well under the smallest test file (10 KB)
const FILE_SIZE_THRESHOLD = Math.min(statSync(imagePath).size, statSync(secondImagePath).size)

/**
 * Records the files whose parts go to the R2 multipart endpoint, and any other large request,
 * which would mean file bytes were sent some other way.
 */
const trackUploadRequests = ({ page }: { page: Page }) => {
  const otherLargeRequests: string[] = []
  const uploadedParts: string[] = []

  page.on('request', (request) => {
    const url = new URL(request.url())

    if (url.pathname === multipartEndpoint && url.searchParams.has('multipartNumber')) {
      uploadedParts.push(url.searchParams.get('fileName') ?? '')
      return
    }

    const size = Math.max(
      request.postDataBuffer()?.byteLength ?? 0,
      parseInt(request.headers()['content-length'] ?? '0', 10),
    )

    if (size >= FILE_SIZE_THRESHOLD) {
      otherLargeRequests.push(`${request.method()} ${url.pathname} (${size} bytes)`)
    }
  })

  return { otherLargeRequests, uploadedParts }
}

test.describe('storage-r2 client uploads E2E', () => {
  let page: Page
  let mediaClientURL: AdminUrlUtil
  let mediaContainerURL: AdminUrlUtil

  test.beforeAll(async ({ browser }, testInfo) => {
    testInfo.setTimeout(TEST_TIMEOUT_LONG)
    const { serverURL } = await initPayloadE2ENoConfig({ dirname })

    mediaClientURL = new AdminUrlUtil(serverURL, mediaClientSlug)
    mediaContainerURL = new AdminUrlUtil(serverURL, mediaContainerSlug)

    const context = await browser.newContext()
    page = await context.newPage()
    await ensureCompilationIsDone({ page, serverURL })
  })

  test('should complete a single client upload via the admin UI', async () => {
    await gotoAndWaitForForm(page, mediaClientURL.create)
    await page.setInputFiles('input[type="file"]', imagePath)
    await expect(page.locator('#field-filemanager-filename')).toHaveValue('image.png')
    await saveDocAndAssert(page)
  })

  test('should send file bytes to the R2 multipart endpoint, not with the document', async ({
    browser,
  }) => {
    const context = await browser.newContext()
    const testPage = await context.newPage()
    const { otherLargeRequests, uploadedParts } = trackUploadRequests({ page: testPage })

    await gotoAndWaitForForm(testPage, mediaClientURL.create)
    await testPage.setInputFiles('input[type="file"]', imagePath)
    await saveDocAndAssert(testPage)

    expect(uploadedParts).toEqual(['image.png'])
    expect(
      otherLargeRequests,
      `File bytes sent elsewhere: ${otherLargeRequests.join(', ')}`,
    ).toEqual([])

    await context.close()
  })

  test('should bulk upload multiple files through the R2 multipart endpoint', async ({
    browser,
  }) => {
    const context = await browser.newContext()
    const testPage = await context.newPage()
    const { otherLargeRequests, uploadedParts } = trackUploadRequests({ page: testPage })

    await gotoAndWaitForForm(testPage, mediaContainerURL.create)

    const createNewButton = testPage.locator('#field-files button', {
      hasText: exactText('Create New'),
    })
    await expect(createNewButton).toBeEnabled()
    await createNewButton.click()

    const bulkUploadModal = testPage.locator('#files-bulk-upload-modal-slug-1')
    await expect(bulkUploadModal).toBeVisible()

    await bulkUploadModal
      .locator('.dropzone input[type="file"]')
      .setInputFiles([imagePath, secondImagePath])

    await bulkUploadModal.locator('.bulk-upload--actions-bar__saveButtons button').click()
    await expect(bulkUploadModal).toBeHidden({ timeout: 30_000 })

    expect([...uploadedParts].sort()).toEqual(['image.png', 'test-image.png'])
    expect(
      otherLargeRequests,
      `File bytes sent elsewhere: ${otherLargeRequests.join(', ')}`,
    ).toEqual([])
    await expect(testPage.locator('#field-files .upload--has-many__dragItem')).toHaveCount(2)

    await context.close()
  })

  test('should bulk upload files from the list view through the R2 multipart endpoint', async ({
    browser,
  }) => {
    const context = await browser.newContext()
    const testPage = await context.newPage()
    const { otherLargeRequests, uploadedParts } = trackUploadRequests({ page: testPage })

    await testPage.goto(mediaClientURL.list)
    await expect(testPage.locator('.list-header__title')).toBeVisible()

    const bulkUploadButton = testPage.locator('.list-header__title-actions button', {
      hasText: 'Bulk Upload',
    })
    await expect(bulkUploadButton).toBeEnabled()

    // Click and retry until the dropzone appears, since the button can render before hydration
    const dropzoneInput = testPage.locator('.dropzone input[type="file"]')
    await expect(async () => {
      await bulkUploadButton.click()
      await expect(dropzoneInput).toBeAttached({ timeout: 1500 })
    }).toPass({ intervals: [500], timeout: 5000 })

    await dropzoneInput.setInputFiles([imagePath, secondImagePath])

    const bulkUploadModal = testPage.locator(`#${mediaClientSlug}-bulk-upload-modal-slug-1`)
    const saveButton = bulkUploadModal.locator('.bulk-upload--actions-bar__saveButtons button')
    await expect(saveButton).toBeVisible()
    await saveButton.click()
    await expect(bulkUploadModal).toBeHidden({ timeout: 30_000 })

    expect([...uploadedParts].sort()).toEqual(['image.png', 'test-image.png'])
    expect(
      otherLargeRequests,
      `File bytes sent elsewhere: ${otherLargeRequests.join(', ')}`,
    ).toEqual([])

    await context.close()
  })
})
