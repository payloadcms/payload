import type { ContainerClient } from '@azure/storage-blob'
import type { Page } from '@playwright/test'

import { BlobServiceClient } from '@azure/storage-blob'
import { expect, test } from '@playwright/test'
import dotenv from 'dotenv'
import * as path from 'path'
import { fileURLToPath } from 'url'

import type { PayloadTestSDK } from '../../__helpers/shared/sdk/index.js'

import { ensureCompilationIsDone, saveDocAndAssert } from '../../__helpers/e2e/helpers.js'
import { AdminUrlUtil } from '../../__helpers/shared/adminUrlUtil.js'
import { initPayloadE2ENoConfig } from '../../__helpers/shared/initPayloadE2ENoConfig.js'
import { TEST_TIMEOUT_LONG } from '../../playwright.config.js'
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

  /**
   * Drives the actual admin form through a clientUploads submit and asserts
   * that the user-defined `prefix.defaultValue` ends up on the saved doc — i.e.
   * the plugin no longer clobbers the user's callback (see getFields.ts).
   */
  test('respects user-defined prefix.defaultValue when creating a doc via clientUploads', async () => {
    await page.goto(mediaWithDocPrefixURL.create)
    await page.setInputFiles('input[type="file"]', path.resolve(dirname, '../../uploads/image.png'))
    await saveDocAndAssert(page)

    const docId = page.url().split('/').pop()!

    const result = await payloadSDK.find({
      collection: mediaWithDocPrefixSlug,
      where: { id: { equals: docId } },
    })

    const doc = result.docs[0]

    const blobNames: string[] = []
    for await (const blob of containerClient.listBlobsFlat()) {
      blobNames.push(blob.name)
    }

    expect(blobNames).toEqual(
      expect.arrayContaining([expect.stringMatching(/^doc-[a-z0-9]{1,8}\/image\.png$/)]),
    )

    expect(doc?.prefix).toMatch(/^doc-[a-z0-9]{1,8}$/)
  })
})
