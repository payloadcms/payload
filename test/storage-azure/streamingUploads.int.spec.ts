import type { ContainerClient } from '@azure/storage-blob'
import type { CollectionSlug, Payload } from 'payload'

import { BlobServiceClient } from '@azure/storage-blob'
import { readFile } from 'node:fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import { expect } from 'vitest'

import { afterEach, beforeEach, suite, test } from '../__helpers/int/vitest.js'
import { mediaSlug, mediaWithPrefixSlug, prefix } from './shared.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

suite('@payloadcms/storage-azure streamingUploads', { config: './config.ts' }, () => {
  let TEST_CONTAINER: string
  let client: ContainerClient

  beforeEach(async () => {
    TEST_CONTAINER = process.env.AZURE_STORAGE_CONTAINER_NAME!

    const blobServiceClient = BlobServiceClient.fromConnectionString(
      process.env.AZURE_STORAGE_CONNECTION_STRING!,
    )
    client = blobServiceClient.getContainerClient(TEST_CONTAINER)

    await client.createIfNotExists()
    await clearContainer()
  }, 90000)

  afterEach(async () => {
    await clearContainer()
  })

  test('preserves mime type when uploaded via rest endpoint', async ({ restClient }) => {
    const fileBuffer = await readFile(path.resolve(dirname, '../uploads/image.png'))

    const data = new FormData()
    data.append('file', new Blob([fileBuffer], { type: 'image/png' }), 'image1.png')
    const newMedia: { doc: { url: string } } = await (
      await restClient.POST('/media', {
        body: data,
      })
    ).json()
    const response = await restClient.GET(newMedia.doc.url.replace(/^\/api/, '') as `/${string}`)
    expect(response.headers.get('content-type')).toEqual('image/png')
  })

  test('can upload', async ({ payload }) => {
    const upload = await payload.create({
      collection: mediaSlug,
      data: {},
      filePath: path.resolve(dirname, '../uploads/image.png'),
    })

    expect(upload.id).toBeTruthy()
    await verifyUploads({ payload }, { collectionSlug: mediaSlug, uploadId: upload.id })
    expect(upload.url).toEqual(`/api/${mediaSlug}/file/${String(upload.filename)}`)
  })

  test('can upload with prefix', async ({ payload }) => {
    const upload = await payload.create({
      collection: mediaWithPrefixSlug,
      data: {},
      filePath: path.resolve(dirname, '../uploads/image.png'),
    })

    expect(upload.id).toBeTruthy()
    await verifyUploads(
      { payload },
      {
        collectionSlug: mediaWithPrefixSlug,
        uploadId: upload.id,
        prefix,
      },
    )
    expect(upload.url).toEqual(
      `/api/${mediaWithPrefixSlug}/file/${String(upload.filename)}?prefix=${encodeURIComponent(prefix)}`,
    )
  })

  test('returns 404 for non-existing file', async ({ restClient }) => {
    const response = await restClient.GET(`/${mediaSlug}/file/nonexistent.png`)
    expect(response.status).toBe(404)
  })

  async function clearContainer() {
    for await (const blob of client.listBlobsFlat()) {
      await client.deleteBlob(blob.name)
    }
  }

  async function verifyUploads(
    { payload }: { payload: Payload },
    {
      collectionSlug,
      uploadId,
      prefix = '',
    }: {
      collectionSlug: CollectionSlug
      prefix?: string
      uploadId: number | string
    },
  ) {
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
