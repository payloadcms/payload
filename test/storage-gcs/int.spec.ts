import type { Bucket } from '@google-cloud/storage'
import type { Payload } from 'payload'

import { Storage } from '@google-cloud/storage'
import path from 'path'
import { fileURLToPath } from 'url'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'

import type { NextRESTClient } from '../__helpers/shared/NextRESTClient.js'

import { initPayloadInt } from '../__helpers/shared/initPayloadInt.js'
import {
  mediaSlug,
  mediaWithAlwaysInsertFieldsSlug,
  mediaWithPrefixSlug,
  prefix,
} from './shared.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

let restClient: NextRESTClient
let payload: Payload

describe('@payloadcms/storage-gcs', () => {
  let bucket: Bucket

  const clearBucket = async () => {
    const [files] = await bucket.getFiles()
    await Promise.all(files.map((file) => file.delete()))
  }

  beforeAll(async () => {
    ;({ payload, restClient } = await initPayloadInt(dirname))

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

  afterAll(async () => {
    await payload.destroy()
  })

  afterEach(async () => {
    await clearBucket()
  })

  async function verifyUploads({
    collectionSlug,
    filePrefix = '',
    uploadId,
  }: {
    collectionSlug: string
    filePrefix?: string
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
      filePrefix: prefix,
      uploadId: upload.id,
    })
    expect(upload.url).toEqual(
      `/api/${mediaWithPrefixSlug}/file/${String(upload.filename)}?prefix=${prefix}`,
    )
  })

  it('returns 404 for non-existing file', async () => {
    const response = await restClient.GET(`/${mediaSlug}/file/nonexistent.png`)
    expect(response.status).toBe(404)
  })

  it('has prefix field by default even when plugin is disabled', async () => {
    // This collection uses a gcsStorage plugin with enabled: false.
    // The upload will use local storage, but the prefix field should still exist.
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
