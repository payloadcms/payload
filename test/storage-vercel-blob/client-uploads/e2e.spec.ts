import type { Page } from '@playwright/test'

import { expect, test } from '@playwright/test'
import { list } from '@vercel/blob'
import dotenv from 'dotenv'
import * as path from 'path'
import sharp from 'sharp'
import { fileURLToPath } from 'url'

import {
  ensureCompilationIsDone,
  exactText,
  saveDocAndAssert,
} from '../../__helpers/e2e/helpers.js'
import { AdminUrlUtil } from '../../__helpers/shared/adminUrlUtil.js'
import { initPayloadE2ENoConfig } from '../../__helpers/shared/initPayloadE2ENoConfig.js'
import { TEST_TIMEOUT_LONG } from '../../playwright.config.js'
import { mediaSlug } from '../shared.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

dotenv.config({ path: path.resolve(dirname, '../../plugin-cloud-storage/.env.emulated') })

// e.g. "localhost:3100" — used to detect file upload requests going to Vercel Blob emulator
const blobHost = new URL(process.env.STORAGE_VERCEL_BLOB_BASE_URL!).host
const FILE_SIZE_THRESHOLD = 1_000

const mediaContainerSlug = 'media-container'

test.describe('storage-vercel-blob client uploads E2E', () => {
  let page: Page
  let mediaURL: AdminUrlUtil
  let mediaContainerURL: AdminUrlUtil
  let serverURL: string
  let payloadHost: string

  async function deleteAllMedia() {
    // Delete all media documents so blobs are also removed from the emulator.
    // The afterDelete hook triggers blob deletion, preventing "Blob already exists" errors
    // on re-runs (the emulator rejects duplicate filenames).
    try {
      const res = await fetch(`${serverURL}/api/media?limit=100`)
      if (res.ok) {
        const { docs }: { docs: { id: string }[] } = await res.json()
        await Promise.all(
          docs.map((doc) =>
            fetch(`${serverURL}/api/media/${doc.id}`, { method: 'DELETE' }).catch(() => null),
          ),
        )
      }
    } catch (_err) {
      // ignore cleanup errors
    }
  }

  test.beforeAll(async ({ browser }, testInfo) => {
    testInfo.setTimeout(TEST_TIMEOUT_LONG)
    ;({ serverURL } = await initPayloadE2ENoConfig({ dirname }))
    payloadHost = new URL(serverURL).host

    mediaURL = new AdminUrlUtil(serverURL, mediaSlug)
    mediaContainerURL = new AdminUrlUtil(serverURL, mediaContainerSlug)

    const context = await browser.newContext()
    page = await context.newPage()
    await ensureCompilationIsDone({ page, serverURL })
    await deleteAllMedia()
  })

  test.afterEach(deleteAllMedia)

  test('should complete a single client upload via the admin UI', async () => {
    await page.goto(mediaURL.create)
    await page.setInputFiles('input[type="file"]', path.resolve(dirname, '../../uploads/image.png'))
    await expect(page.locator('.file-field__filename')).toHaveValue('image.png')
    await saveDocAndAssert(page)
  })

  for (const format of ['webp', 'gif', 'tiff'] as const) {
    test(`should retain processed image bytes after saving a ${format} client upload`, async () => {
      const buffer = await sharp({
        create: { background: '#336699', channels: 3, height: 80, width: 120 },
      })
        .toFormat(format)
        .toBuffer()

      await page.goto(mediaURL.create)
      await page.setInputFiles('input[type="file"]', {
        name: `client-upload.${format}`,
        buffer,
        mimeType: `image/${format}`,
      })

      const savedResponse = page.waitForResponse(
        (response) =>
          new URL(response.url()).pathname === `/api/${mediaSlug}` &&
          response.request().method() === 'POST',
      )

      await saveDocAndAssert(page)

      const { doc } = await (await savedResponse).json()
      const { blobs } = await list()
      const stored = blobs.find((blob) => blob.pathname.endsWith(`/${doc.filename}`))

      expect(blobs.every((blob) => blob.size > 0)).toBe(true)
      expect(stored).toBeDefined()

      const download = await fetch(stored!.url)
      const bytes = Buffer.from(await download.arrayBuffer())

      expect(doc.filesize).toBeGreaterThan(0)
      expect(stored!.size).toBe(doc.filesize)
      expect(bytes.length).toBe(doc.filesize)

      const served = await page.request.get(new URL(doc.url, serverURL).href)

      expect(served.status()).toBe(200)
      expect((await served.body()).equals(bytes)).toBe(true)
      expect(await sharp(bytes).metadata()).toMatchObject({
        format,
        height: 200,
        width: 200,
      })
    })
  }

  test('should retain cropped and resized client upload bytes', async () => {
    const format = 'png'
    const buffer = await sharp({
      create: { background: '#336699', channels: 3, height: 80, width: 120 },
    })
      .toFormat(format)
      .toBuffer()

    await page.goto(mediaURL.create)
    await page.setInputFiles('input[type="file"]', {
      name: `client-upload.${format}`,
      buffer,
      mimeType: `image/${format}`,
    })

    await page.locator('.file-field__edit').click()
    await page.locator('.edit-upload__input input[name="Width (px)"]').fill('60')
    await page.locator('.edit-upload__input input[name="Height (px)"]').fill('40')
    await page.locator('button:has-text("Apply Changes")').click()

    const savedResponse = page.waitForResponse(
      (response) =>
        new URL(response.url()).pathname === `/api/${mediaSlug}` &&
        response.request().method() === 'POST',
    )

    await saveDocAndAssert(page)

    const { doc } = await (await savedResponse).json()
    const { blobs } = await list()
    const stored = blobs.find((blob) => blob.pathname.endsWith(`/${doc.filename}`))

    expect(blobs.every((blob) => blob.size > 0)).toBe(true)
    expect(stored).toBeDefined()

    const download = await fetch(stored!.url)
    const bytes = Buffer.from(await download.arrayBuffer())

    expect(doc.filesize).toBeGreaterThan(0)
    expect(stored!.size).toBe(doc.filesize)
    expect(bytes.length).toBe(doc.filesize)

    const served = await page.request.get(new URL(doc.url, serverURL).href)

    expect(served.status()).toBe(200)
    expect((await served.body()).equals(bytes)).toBe(true)
    expect(await sharp(bytes).metadata()).toMatchObject({
      format,
      height: 200,
      width: 200,
    })
  })

  test('should upload file directly to Vercel Blob, not through the Payload server', async ({
    browser,
  }) => {
    const context = await browser.newContext()
    const testPage = await context.newPage()

    const largeRequestsToPayload: string[] = []
    const uploadsToBlob: string[] = []

    testPage.on('request', (request) => {
      const url = request.url()
      const contentLength = parseInt(request.headers()['content-length'] ?? '0', 10)

      if (new URL(url).host === payloadHost && contentLength > FILE_SIZE_THRESHOLD) {
        largeRequestsToPayload.push(`${request.method()} ${url} (${contentLength} bytes)`)
      }
      if (new URL(url).host === blobHost) {
        uploadsToBlob.push(url)
      }
    })

    await testPage.goto(mediaURL.create)
    await testPage.setInputFiles(
      'input[type="file"]',
      path.resolve(dirname, '../../uploads/image.png'),
    )
    await saveDocAndAssert(testPage)

    expect(
      largeRequestsToPayload,
      `File bytes were sent to Payload: ${largeRequestsToPayload.join(', ')}`,
    ).toHaveLength(0)

    expect(
      uploadsToBlob.length,
      'Expected at least one request to the Vercel Blob emulator',
    ).toBeGreaterThanOrEqual(1)

    await context.close()
  })

  test('should bulk upload multiple files directly to Vercel Blob, not through Payload', async ({
    browser,
  }) => {
    const context = await browser.newContext()
    const testPage = await context.newPage()

    const largeRequestsToPayload: string[] = []
    const uploadsToBlob: string[] = []

    testPage.on('request', (request) => {
      const url = request.url()
      const contentLength = parseInt(request.headers()['content-length'] ?? '0', 10)

      if (new URL(url).host === payloadHost && contentLength > FILE_SIZE_THRESHOLD) {
        largeRequestsToPayload.push(`${request.method()} ${url} (${contentLength} bytes)`)
      }
      if (new URL(url).host === blobHost) {
        uploadsToBlob.push(url)
      }
    })

    await testPage.goto(mediaContainerURL.create)

    const createNewButton = testPage.locator('#field-files button', {
      hasText: exactText('Create New'),
    })
    await expect(createNewButton).toBeVisible()
    await expect(createNewButton).toBeEnabled()
    await createNewButton.click()

    const bulkUploadModal = testPage.locator('#files-bulk-upload-drawer-slug-1')
    await expect(bulkUploadModal).toBeVisible()

    await bulkUploadModal
      .locator('.dropzone input[type="file"]')
      .setInputFiles([
        path.resolve(dirname, '../../uploads/image.png'),
        path.resolve(dirname, '../../uploads/test-image.png'),
      ])

    const saveButton = bulkUploadModal.locator('.bulk-upload--actions-bar__saveButtons button')
    await saveButton.click()

    await expect(bulkUploadModal).toBeHidden({ timeout: 30_000 })

    expect(
      uploadsToBlob.length,
      'Expected uploads to go to Vercel Blob, not Payload',
    ).toBeGreaterThanOrEqual(2)

    expect(
      largeRequestsToPayload,
      `File bytes were sent to Payload: ${largeRequestsToPayload.join(', ')}`,
    ).toHaveLength(0)

    const items = testPage.locator('#field-files .upload--has-many__dragItem')
    await expect(items).toHaveCount(2)

    await context.close()
  })

  test('should bulk upload files from the list view directly to Vercel Blob, not through Payload', async ({
    browser,
  }) => {
    const context = await browser.newContext()
    const testPage = await context.newPage()

    const largeRequestsToPayload: string[] = []
    const uploadsToBlob: string[] = []

    testPage.on('request', (request) => {
      const url = request.url()
      const contentLength = parseInt(request.headers()['content-length'] ?? '0', 10)

      if (new URL(url).host === payloadHost && contentLength > FILE_SIZE_THRESHOLD) {
        largeRequestsToPayload.push(`${request.method()} ${url} (${contentLength} bytes)`)
      }
      if (new URL(url).host === blobHost) {
        uploadsToBlob.push(url)
      }
    })

    await testPage.goto(mediaURL.list)
    await expect(testPage.locator('.list-header__title')).toBeVisible()

    const bulkUploadButton = testPage.locator('.list-header__title-actions button', {
      hasText: 'Bulk Upload',
    })
    await expect(bulkUploadButton).toBeEnabled()

    // Click and retry until dropzone appears (handles hydration timing)
    const dropzoneInput = testPage.locator('.dropzone input[type="file"]')
    await expect(async () => {
      await bulkUploadButton.click()
      await expect(dropzoneInput).toBeAttached({ timeout: 1500 })
    }).toPass({ intervals: [500], timeout: 5000 })

    await testPage.setInputFiles('.dropzone input[type="file"]', [
      path.resolve(dirname, '../../uploads/image.png'),
      path.resolve(dirname, '../../uploads/test-image.png'),
    ])

    const bulkUploadModal = testPage.locator('#media-bulk-upload-drawer-slug-1')
    const saveButton = bulkUploadModal.locator('.bulk-upload--actions-bar__saveButtons button')
    await expect(saveButton).toBeVisible()
    await saveButton.click()

    await expect(bulkUploadModal).toBeHidden({ timeout: 30_000 })

    expect(
      uploadsToBlob.length,
      'Expected uploads to go to Vercel Blob, not Payload',
    ).toBeGreaterThanOrEqual(2)

    expect(
      largeRequestsToPayload,
      `File bytes were sent to Payload: ${largeRequestsToPayload.join(', ')}`,
    ).toHaveLength(0)

    await context.close()
  })
})
