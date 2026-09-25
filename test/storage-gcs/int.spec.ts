import type { Bucket } from '@google-cloud/storage'
import type { Payload } from 'payload'

import { Storage } from '@google-cloud/storage'
import path from 'path'
import { fileURLToPath } from 'url'
import { expect } from 'vitest'

import { copyGcsFile } from '../../packages/storage-gcs/src/copyFile.js'
import { test } from '../__helpers/int/vitest.js'
import {
  mediaSlug,
  mediaWithAlwaysInsertFieldsSlug,
  mediaWithPrefixSlug,
  prefix,
} from './shared.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

test.suite('@payloadcms/storage-gcs', { config: './config.ts', resetBetweenTests: false }, () => {
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

  test('should copy a GCS object without replacing an existing destination', async () => {
    const source = bucket.file('copy-source.txt')
    const destination = bucket.file('copy-destination.txt')
    await source.save(Buffer.from('copy source'))
    await source.setMetadata({ contentType: 'text/plain' })
    expect((await source.getMetadata())[0].contentType).toBe('text/plain')
    const client = new Storage({
      apiEndpoint: process.env.GCS_ENDPOINT,
      projectId: process.env.GCS_PROJECT_ID,
    })

    await copyGcsFile({ bucket: bucket.name, client, from: source.name, to: destination.name })

    expect((await destination.download())[0].toString()).toBe('copy source')
    expect((await destination.getMetadata())[0].contentType).toBe('text/plain')
    expect((await source.download())[0].toString()).toBe('copy source')
    await expect(
      copyGcsFile({ bucket: bucket.name, client, from: source.name, to: destination.name }),
    ).rejects.toThrow()
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
      overrideAccess: true,
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
      overrideAccess: true,
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
      overrideAccess: true,
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
      overrideAccess: true,
    })

    expect(upload.id).toBeTruthy()
    expect(upload.prefix).toBe('test')
  })
})
