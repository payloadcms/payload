import type { ContainerClient } from '@azure/storage-blob'
import type { CollectionSlug, Payload } from 'payload'

import { BlobServiceClient } from '@azure/storage-blob'
import path from 'path'
import { fileURLToPath } from 'url'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'

import type { NextRESTClient } from '../helpers/shared/NextRESTClient.js'

import { initPayloadInt } from '../helpers/shared/initPayloadInt.js'
import { mediaSlug, mediaWithPrefixSlug, prefix } from './shared.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

let restClient: NextRESTClient
let payload: Payload

describe('@payloadcms/storage-azure', () => {
  let TEST_CONTAINER: string
  let client: ContainerClient

  beforeAll(async () => {
    ;({ payload, restClient } = await initPayloadInt(dirname))
    TEST_CONTAINER = process.env.AZURE_STORAGE_CONTAINER_NAME!

    const blobServiceClient = BlobServiceClient.fromConnectionString(
      process.env.AZURE_STORAGE_CONNECTION_STRING!,
    )
    client = blobServiceClient.getContainerClient(TEST_CONTAINER)

    await client.createIfNotExists()
    await clearContainer()
  }, 90000)

  afterAll(async () => {
    await payload.destroy()
  })

  afterEach(async () => {
    await clearContainer()
  })

  it('can upload', async () => {
    const upload = await payload.create({
      collection: mediaSlug,
      data: {},
      filePath: path.resolve(dirname, '../uploads/image.png'),
    })

    expect(upload.id).toBeTruthy()
    await verifyUploads({ collectionSlug: mediaSlug, uploadId: upload.id })
    expect(upload.url).toEqual(`/api/${mediaSlug}/file/${String(upload.filename)}`)
  })

  it('can upload with prefix', async () => {
    const upload = await payload.create({
      collection: mediaWithPrefixSlug,
      data: {},
      filePath: path.resolve(dirname, '../uploads/image.png'),
    })

    expect(upload.id).toBeTruthy()
    await verifyUploads({
      collectionSlug: mediaWithPrefixSlug,
      uploadId: upload.id,
      prefix,
    })
    expect(upload.url).toEqual(`/api/${mediaWithPrefixSlug}/file/${String(upload.filename)}`)
  })

  it('returns 404 for non-existing file', async () => {
    const response = await restClient.GET(`/${mediaSlug}/file/nonexistent.png`)
    expect(response.status).toBe(404)
  })

  async function clearContainer() {
    for await (const blob of client.listBlobsFlat()) {
      await client.deleteBlob(blob.name)
    }
  }

  async function verifyUploads({
    collectionSlug,
    uploadId,
    prefix = '',
  }: {
    collectionSlug: CollectionSlug
    prefix?: string
    uploadId: number | string
  }) {
    const uploadData = (await payload.findByID({
      collection: collectionSlug,
      id: uploadId,
    })) as unknown as { filename: string; sizes: Record<string, { filename: string }> }

    const fileKeys = Object.keys(uploadData.sizes || {}).map((key) => {
      const rawFilename = uploadData.sizes[key].filename
      return prefix ? `${prefix}/${rawFilename}` : rawFilename
    })

    fileKeys.push(`${prefix ? `${prefix}/` : ''}${uploadData.filename}`)

    for (const key of fileKeys) {
      const blobClient = client.getBlobClient(key)
      try {
        const props = await blobClient.getProperties()
        expect(props).toBeDefined()
        expect(props.contentLength).toBeGreaterThan(0)
      } catch (error) {
        console.error('Error verifying uploads:', key, error)
        throw error
      }
    }
  }
})
