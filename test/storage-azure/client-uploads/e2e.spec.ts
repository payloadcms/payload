import type { ContainerClient } from '@azure/storage-blob'
import type { Page } from '@playwright/test'

import { BlobServiceClient } from '@azure/storage-blob'
import { expect, test } from '@playwright/test'
import dotenv from 'dotenv'
import * as path from 'path'
import { fileURLToPath } from 'url'

import type { PayloadTestSDK } from '../../__helpers/shared/sdk/index.js'

import { gotoAndWaitForForm, saveDocAndAssert } from '../../__helpers/e2e/helpers.js'
import {
  expectUploadProgressSequence,
  recordToastHistory,
  throttleUploads,
} from '../../__helpers/e2e/uploadProgress.js'
import { AdminUrlUtil } from '../../__helpers/shared/adminUrlUtil.js'
import { initPayloadE2ENoConfig } from '../../__helpers/shared/initPayloadE2ENoConfig.js'
import { ensureCompilationIsDone } from '../../__setup/e2e/ensureCompilationIsDone.js'
import { POLL_TOPASS_TIMEOUT, TEST_TIMEOUT_LONG } from '../../playwright.config.js'
import { mediaWithDocPrefixSlug } from './collections/MediaWithDocPrefix.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

dotenv.config({ path: path.resolve(dirname, '../../plugin-cloud-storage/.env.emulated') })

test.describe('storage-azure client uploads E2E', () => {
  let page: Page
  let mediaWithDocPrefixURL: AdminUrlUtil
  let payloadSDK: PayloadTestSDK<{ collections: Record<string, unknown> }>
  let containerClient: ContainerClient

  test.beforeAll(async ({ browser }, testInfo) => {
    testInfo.setTimeout(TEST_TIMEOUT_LONG)
    const { payload, serverURL } = await initPayloadE2ENoConfig({ dirname })

    payloadSDK = payload as unknown as typeof payloadSDK
    mediaWithDocPrefixURL = new AdminUrlUtil(serverURL, mediaWithDocPrefixSlug)

    const blobService = BlobServiceClient.fromConnectionString(
      process.env.AZURE_STORAGE_CONNECTION_STRING!,
    )

    await blobService.setProperties({
      cors: [
        {
          allowedHeaders: '*',
          allowedMethods: 'GET,PUT,POST,DELETE,OPTIONS,HEAD',
          allowedOrigins: '*',
          exposedHeaders: '*',
          maxAgeInSeconds: 3600,
        },
      ],
    })

    containerClient = blobService.getContainerClient(process.env.AZURE_STORAGE_CONTAINER_NAME!)
    await containerClient.createIfNotExists()

    // Clear leftover blobs from previous runs so the listBlobsFlat assertion
    // below only sees uploads from this test.
    for await (const blob of containerClient.listBlobsFlat()) {
      await containerClient.deleteBlob(blob.name)
    }

    const context = await browser.newContext()
    page = await context.newPage()
    await ensureCompilationIsDone({ page, serverURL })
  })

  test('should show upload progress while the file is sent to Azure', async () => {
    test.setTimeout(TEST_TIMEOUT_LONG)
    await gotoAndWaitForForm(page, mediaWithDocPrefixURL.create)
    await page.setInputFiles(
      'input[type="file"]',
      path.resolve(dirname, '../../uploads/ios-image.jpeg'),
    )

    const getToastHistory = await recordToastHistory({ page })
    // 1.1 MB at 200 KB/s takes several seconds to send.
    const stopThrottling = await throttleUploads({ bytesPerSecond: 200 * 1024, page })

    // Throttle only the transfer to storage; the document request that follows is not slowed.
    try {
      await page.click('#action-save')
      await expect(page.locator('.payload-toast-container')).toContainText(
        'Processing and saving ios-image.jpeg',
        { timeout: POLL_TOPASS_TIMEOUT },
      )
    } finally {
      await stopThrottling()
    }

    await expect(page.locator('.payload-toast-container')).toContainText('successfully', {
      timeout: POLL_TOPASS_TIMEOUT,
    })

    expectUploadProgressSequence({
      fileName: 'ios-image.jpeg',
      history: await getToastHistory(),
    })
  })

  /**
   * Drives the actual admin form through a clientUploads submit and asserts
   * that the saved document prefix identifies the contained upload destination.
   */
  test('should contain prefix.defaultValue beneath the collection prefix via clientUploads', async () => {
    await gotoAndWaitForForm(page, mediaWithDocPrefixURL.create)
    await page.setInputFiles('input[type="file"]', path.resolve(dirname, '../../uploads/image.png'))
    await saveDocAndAssert(page)

    const docId = page.url().split('/').pop()!

    const result = await payloadSDK.find({
      collection: mediaWithDocPrefixSlug,
      where: { id: { equals: docId } },
      overrideAccess: true,
    })

    const doc = result.docs[0]

    const blobNames: string[] = []
    for await (const blob of containerClient.listBlobsFlat()) {
      blobNames.push(blob.name)
    }

    expect(blobNames).toEqual(
      expect.arrayContaining([
        expect.stringMatching(
          /^docprefix-collection\/doc-[a-z0-9]{1,8}\/[0-9a-f-]+\/image(?:-\d+)?\.png$/,
        ),
      ]),
    )

    expect(doc?.prefix).toMatch(/^docprefix-collection\/doc-[a-z0-9]{1,8}$/)
  })
})
