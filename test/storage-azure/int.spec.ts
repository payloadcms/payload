import type { ContainerClient } from '@azure/storage-blob'
import type { CollectionSlug, Payload } from 'payload'

import { BlobServiceClient } from '@azure/storage-blob'
import { readFile } from 'node:fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import { expect } from 'vitest'

import { test } from '../__helpers/int/vitest.js'
import {
  mediaSlug,
  mediaWithAlwaysInsertFieldsSlug,
  mediaWithPrefixSlug,
  prefix,
} from './shared.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

test.suite('@payloadcms/storage-azure', { config: './config.ts', resetBetweenTests: false }, () => {
  let TEST_CONTAINER: string
  let client: ContainerClient

  const clearContainer = async () => {
    for await (const blob of client.listBlobsFlat()) {
      await client.deleteBlob(blob.name)
    }
  }

  test.beforeAll(async () => {
    TEST_CONTAINER = process.env.AZURE_STORAGE_CONTAINER_NAME!

    const blobServiceClient = BlobServiceClient.fromConnectionString(
      process.env.AZURE_STORAGE_CONNECTION_STRING!,
    )
    client = blobServiceClient.getContainerClient(TEST_CONTAINER)

    await client.createIfNotExists()
    await clearContainer()
  }, 90000)

  test.afterEach(async () => {
    await clearContainer()
  })

  test('preserves mime type when uploaded via rest endpoint', async ({ restClient }) => {
    const fileBuffer = await readFile(`${dirname}/../uploads/image.png`)

    const data = new FormData()
    data.append('file', new Blob([fileBuffer], { type: 'image/png' }), 'image2.png')
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
      `/api/${mediaWithPrefixSlug}/file/${String(upload.filename)}?prefix=${prefix}`,
    )
  })

  test('returns 404 for non-existing file', async ({ restClient }) => {
    const response = await restClient.GET(`/${mediaSlug}/file/nonexistent.png`)
    expect(response.status).toBe(404)
  })

  test('has prefix field by default even when plugin is disabled', async ({ payload }) => {
    // This collection uses an azureStorage plugin with enabled: false.
    // The upload uses local storage, but the prefix field still exists.
    const upload = await payload.create({
      collection: mediaWithAlwaysInsertFieldsSlug,
      data: {
        prefix: 'test',
      },
      filePath: path.resolve(dirname, '../uploads/image.png'),
    })

    expect(upload.id).toBeTruthy()
    expect(upload.prefix).toBe('test')
  })

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

    const fileKeys = Object.values(uploadData.sizes || {}).map(({ filename: rawFilename }) =>
      prefix ? `${prefix}/${rawFilename}` : rawFilename,
    )

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
