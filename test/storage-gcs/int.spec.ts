import type { Bucket } from '@google-cloud/storage'
import type { Payload } from 'payload'

import { Storage } from '@google-cloud/storage'
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

test.suite({ config: './config.ts', resetBetweenTests: false })('@payloadcms/storage-gcs', () => {
  let bucket: Bucket

  const clearBucket = async () => {
    const [files] = await bucket.getFiles()
    await Promise.all(files.map((file) => file.delete()))
  }

  test.beforeAll(async () => {
    const client = new Storage({
      apiEndpoint: process.env.GCS_ENDPOINT,
      projectId: process.env.GCS_PROJECT_ID,
    })
    bucket = client.bucket(process.env.GCS_BUCKET!)

    const [bucketExists] = await bucket.exists()
    if (!bucketExists) {
      await bucket.create()
    }

    await clearBucket()
  })

  test.afterEach(async () => {
    await clearBucket()
  })

  async function verifyUploads({
    collectionSlug,
    filePrefix = '',
    payload,
    uploadId,
  }: {
    collectionSlug: string
    filePrefix?: string
    payload: Payload
    uploadId: number | string
  }) {
    const uploadData = (await payload.findByID({
      id: uploadId,
      collection: collectionSlug as 'media',
    })) as unknown as { filename: string; sizes: Record<string, { filename: string }> }

    const fileKeys = Object.values(uploadData.sizes || {}).map(({ filename: rawFilename }) =>
      filePrefix ? `${filePrefix}/${rawFilename}` : rawFilename,
    )

    fileKeys.push(`${filePrefix ? `${filePrefix}/` : ''}${uploadData.filename}`)

    for (const key of fileKeys) {
      const [exists] = await bucket.file(key).exists()
      expect(exists).toBe(true)
    }
  }

  test('can upload', async ({ payload }) => {
    const upload = await payload.create({
      collection: mediaSlug,
      data: {},
      filePath: path.resolve(dirname, '../uploads/image.png'),
    })

    expect(upload.id).toBeTruthy()
    await verifyUploads({ collectionSlug: mediaSlug, payload, uploadId: upload.id })
    expect(upload.url).toEqual(`/api/${mediaSlug}/file/${String(upload.filename)}`)
  })

  test('can upload with prefix', async ({ payload }) => {
    const upload = await payload.create({
      collection: mediaWithPrefixSlug,
      data: {},
      filePath: path.resolve(dirname, '../uploads/image.png'),
    })

    expect(upload.id).toBeTruthy()
    await verifyUploads({
      collectionSlug: mediaWithPrefixSlug,
      filePrefix: prefix,
      payload,
      uploadId: upload.id,
    })
    expect(upload.url).toEqual(
      `/api/${mediaWithPrefixSlug}/file/${String(upload.filename)}?prefix=${prefix}`,
    )
  })

  test('returns 404 for non-existing file', async ({ restClient }) => {
    const response = await restClient.GET(`/${mediaSlug}/file/nonexistent.png`)
    expect(response.status).toBe(404)
  })

  test('has prefix field by default even when plugin is disabled', async ({ payload }) => {
    // This collection uses a gcsStorage plugin with enabled: false.
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
})
