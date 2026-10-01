/* eslint vitest/no-standalone-expect: ["error", { "additionalTestBlockFunctions": ["test"] }] -- Tests use the shared fixture wrapper. */
import { BlobServiceClient } from '@azure/storage-blob'
import { readFile } from 'node:fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import { expect } from 'vitest'

import type { NextRESTClient } from '../__helpers/shared/NextRESTClient.js'

import { test } from '../__helpers/int/vitest.js'
import {
  azureBaseURL,
  azureConnectionString,
  privateContainerName,
  privateMediaSlug,
  publicContainerName,
  publicMediaSlug,
} from './publicAccess.config.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const uploadImage = async (restClient: NextRESTClient, slug: string) => {
  const fileBuffer = await readFile(`${dirname}/../uploads/image.png`)

  const data = new FormData()
  data.append('file', new Blob([fileBuffer], { type: 'image/png' }), 'anon-probe.png')

  const response = await restClient.POST(`/${slug}`, { body: data })
  const { doc } = (await response.json()) as {
    doc: { filename: string; id: number | string; url: string }
  }

  return doc
}

test.suite('storage-azure container access', { config: './publicAccess.config.ts' }, () => {
  test.afterAll(async () => {
    const blobServiceClient = BlobServiceClient.fromConnectionString(azureConnectionString)

    await blobServiceClient.getContainerClient(privateContainerName).deleteIfExists()
    await blobServiceClient.getContainerClient(publicContainerName).deleteIfExists()
  })

  test('should reject anonymous access to a plugin-created private container while the Payload route still serves the file', async ({
    payload,
    restClient,
  }) => {
    const doc = await uploadImage(restClient, privateMediaSlug)
    const stored = await payload.db.findOne<{ _managedFiles?: Array<{ key: string }> }>({
      collection: privateMediaSlug,
      where: { id: { equals: doc.id } },
    })
    const key = stored?._managedFiles?.[0]?.key

    expect(key).toBeTruthy()
    const blobServiceClient = BlobServiceClient.fromConnectionString(azureConnectionString)
    await expect(
      blobServiceClient
        .getContainerClient(privateContainerName)
        .getBlobClient(key!)
        .getProperties(),
    ).resolves.toBeDefined()

    // Anonymous GET straight to Azure must be blocked. Private containers return
    // 403, or 404 when the account disallows public access.
    const directResponse = await fetch(`${azureBaseURL}/${privateContainerName}/${key}`)

    expect([401, 403, 404]).toContain(directResponse.status)

    // The Payload route reads with credentials, so it still serves the file.
    const payloadResponse = await restClient.GET(doc.url.replace(/^\/api/, '') as `/${string}`)

    expect(payloadResponse.status).toBe(200)
  })

  test('should allow anonymous access when the container is created with an explicit public opt-in', async ({
    payload,
    restClient,
  }) => {
    const doc = await uploadImage(restClient, publicMediaSlug)
    const stored = await payload.db.findOne<{ _managedFiles?: Array<{ key: string }> }>({
      collection: publicMediaSlug,
      where: { id: { equals: doc.id } },
    })
    const key = stored?._managedFiles?.[0]?.key

    expect(key).toBeTruthy()
    const directResponse = await fetch(`${azureBaseURL}/${publicContainerName}/${key}`)

    expect(directResponse.status).toBe(200)
  })
})
