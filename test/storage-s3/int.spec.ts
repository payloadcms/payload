import type { CollectionSlug, Payload } from 'payload'

import * as AWS from '@aws-sdk/client-s3'
import path from 'path'
import { fileURLToPath } from 'url'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import type { NextRESTClient } from '../helpers/NextRESTClient.js'

import { initPayloadInt } from '../helpers/initPayloadInt.js'
import {
  mediaSlug,
  mediaWithAlwaysInsertFieldsSlug,
  mediaWithDirectAccessSlug,
  mediaWithDynamicPrefixSlug,
  mediaWithPrefixSlug,
  mediaWithSignedDownloadsSlug,
  prefix,
} from './shared.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

let restClient: NextRESTClient

let payload: Payload

describe('@payloadcms/storage-s3', () => {
  let TEST_BUCKET: string
  let client: AWS.S3Client

  beforeAll(async () => {
    ;({ payload, restClient } = await initPayloadInt(dirname))
    TEST_BUCKET = process.env.S3_BUCKET!

    client = new AWS.S3({
      endpoint: process.env.S3_ENDPOINT!,
      forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true',
      region: process.env.S3_REGION!,
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID!,
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
      },
    })

    await createTestBucket()
    await clearTestBucket()
  })

  afterAll(async () => {
    await payload.destroy()
  })
  afterEach(async () => {
    await clearTestBucket()
  })

  it('can upload', async () => {
    const upload = await payload.create({
      collection: mediaSlug,
      data: {},
      filePath: path.resolve(dirname, '../uploads/image.png'),
    })

    expect(upload.id).toBeTruthy()

    await verifyUploads({
      collectionSlug: mediaSlug,
      uploadId: upload.id,
    })

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

  it('has prefix field with alwaysInsertFields even when plugin is disabled', async () => {
    // This collection uses a s3Storage plugin with enabled: false but alwaysInsertFields: true
    // The upload will use local storage, but the prefix field should still exist
    const upload = await payload.create({
      collection: mediaWithAlwaysInsertFieldsSlug,
      data: {
        prefix: 'test',
      },
      filePath: path.resolve(dirname, '../uploads/image.png'),
    })

    expect(upload.id).toBeTruthy()
    // With alwaysInsertFields: true and enabled: false, the prefix field should still exist
    expect(upload.prefix).toBe('test')
  })

  it('can download with signed downloads', async () => {
    await payload.create({
      collection: mediaWithSignedDownloadsSlug,
      data: {},
      filePath: path.resolve(dirname, '../uploads/image.png'),
    })

    const response = await restClient.GET(`/${mediaWithSignedDownloadsSlug}/file/image.png`)
    expect(response.status).toBe(302)
    const url = response.headers.get('Location')
    expect(url).toBeDefined()
    expect(url!).toContain(`/${TEST_BUCKET}/image.png`)
    expect(new URLSearchParams(url!).get('x-id')).toBe('GetObject')
    const file = await fetch(url!)
    expect(file.headers.get('Content-Type')).toBe('image/png')
  })

  it('should skip signed download', async () => {
    await payload.create({
      collection: mediaWithSignedDownloadsSlug,
      data: {},
      filePath: path.resolve(dirname, '../uploads/small.png'),
    })

    const response = await restClient.GET(`/${mediaWithSignedDownloadsSlug}/file/small.png`, {
      headers: { 'X-Disable-Signed-URL': 'true' },
    })
    expect(response.status).toBe(200)
    expect(response.headers.get('Content-Type')).toBe('image/png')
  })

  it('should return 404 when the file is not found', async () => {
    const response = await restClient.GET(`/${mediaSlug}/file/missing.png`)
    expect(response.status).toBe(404)
  })

  describe('disablePayloadAccessControl', () => {
    it('should return direct S3 URL with encoded filename when uploading file with spaces', async () => {
      const upload = await payload.create({
        collection: mediaWithDirectAccessSlug,
        data: {},
        filePath: path.resolve(dirname, '../uploads/image with spaces.png'),
      })

      expect(upload.id).toBeTruthy()
      expect(upload.filename).toBe('image with spaces.png')

      // When disablePayloadAccessControl is true, URL should point directly to S3
      // and the filename should be URL-encoded
      expect(upload.url).toContain(process.env.S3_ENDPOINT)
      expect(upload.url).toContain(TEST_BUCKET)
      expect(upload.url).toContain('image%20with%20spaces.png')

      // Verify the file can be fetched using the URL
      const response = await fetch(upload.url)
      expect(response.status).toBe(200)
      expect(response.headers.get('Content-Type')).toBe('image/png')
    })

    it('should return direct S3 URL without encoding issues for normal filenames', async () => {
      const upload = await payload.create({
        collection: mediaWithDirectAccessSlug,
        data: {},
        filePath: path.resolve(dirname, '../uploads/image.png'),
      })

      expect(upload.id).toBeTruthy()

      // URL should point directly to S3
      expect(upload.url).toContain(process.env.S3_ENDPOINT)
      expect(upload.url).toContain(TEST_BUCKET)
      expect(upload.url).toContain('image.png')

      // Verify the file can be fetched
      const response = await fetch(upload.url)
      expect(response.status).toBe(200)
    })
  })

  describe('R2', () => {
    it.todo('can upload')
  })

  describe('prefix collision detection', () => {
    beforeEach(async () => {
      // Clear S3 bucket before each test
      await clearTestBucket()
      // Clear database records before each test
      await payload.delete({
        collection: mediaWithPrefixSlug,
        where: {},
      })
      await payload.delete({
        collection: mediaSlug,
        where: {},
      })
      await payload.delete({
        collection: mediaWithAlwaysInsertFieldsSlug,
        where: {},
      })
    })

    it('detects collision within same prefix', async () => {
      const imageFile = path.resolve(dirname, '../uploads/image.png')

      // Upload twice with same prefix
      const upload1 = await payload.create({
        collection: mediaWithPrefixSlug,
        data: {},
        filePath: imageFile,
      })

      const upload2 = await payload.create({
        collection: mediaWithPrefixSlug,
        data: {},
        filePath: imageFile,
      })

      expect(upload1.filename).toBe('image.png')
      expect(upload2.filename).toBe('image-1.png')
      expect(upload1.prefix).toBe(prefix)
      expect(upload2.prefix).toBe(prefix)
    })

    it('works normally for collections without prefix', async () => {
      const imageFile = path.resolve(dirname, '../uploads/image.png')

      // Upload twice to collection without prefix
      const upload1 = await payload.create({
        collection: mediaSlug,
        data: {},
        filePath: imageFile,
      })

      const upload2 = await payload.create({
        collection: mediaSlug,
        data: {},
        filePath: imageFile,
      })

      expect(upload1.filename).toBe('image.png')
      expect(upload2.filename).toBe('image-1.png')
      // @ts-expect-error prefix should never be set
      expect(upload1.prefix).toBeUndefined()
      // @ts-expect-error prefix should never be set
      expect(upload2.prefix).toBeUndefined()
    })

    it('allows same filename under different prefixes', async () => {
      const imageFile = path.resolve(dirname, '../uploads/image.png')

      // Upload with default prefix from config ('test-prefix')
      const upload1 = await payload.create({
        collection: mediaWithPrefixSlug,
        data: {},
        filePath: imageFile,
      })

      // Upload with different prefix
      const upload2 = await payload.create({
        collection: mediaWithPrefixSlug,
        data: {
          prefix: 'different-prefix',
        },
        filePath: imageFile,
      })

      expect(upload1.filename).toBe('image.png')
      expect(upload2.filename).toBe('image.png') // Should NOT increment
      expect(upload1.prefix).toBe(prefix) // 'test-prefix'
      expect(upload2.prefix).toBe('different-prefix')
    })

    it('supports multi-tenant scenario with dynamic prefix from hook', async () => {
      const imageFile = path.resolve(dirname, '../uploads/image.png')

      // Tenant A uploads logo.png
      const tenantAUpload = await payload.create({
        collection: mediaWithDynamicPrefixSlug,
        data: { tenant: 'a' },
        filePath: imageFile,
      })

      // Tenant B uploads logo.png
      const tenantBUpload = await payload.create({
        collection: mediaWithDynamicPrefixSlug,
        data: { tenant: 'b' },
        filePath: imageFile,
      })

      // Both should keep original filename
      expect(tenantAUpload.filename).toBe('image.png')
      expect(tenantBUpload.filename).toBe('image.png')
      expect(tenantAUpload.prefix).toBe('tenant-a')
      expect(tenantBUpload.prefix).toBe('tenant-b')
    })
  })

  async function createTestBucket() {
    try {
      const makeBucketRes = await client.send(new AWS.CreateBucketCommand({ Bucket: TEST_BUCKET }))

      if (makeBucketRes.$metadata.httpStatusCode !== 200) {
        throw new Error(`Failed to create bucket. ${makeBucketRes.$metadata.httpStatusCode}`)
      }
    } catch (e) {
      if (e instanceof AWS.BucketAlreadyOwnedByYou) {
        console.log('Bucket already exists')
      }
    }
  }

  async function clearTestBucket() {
    const listedObjects = await client.send(
      new AWS.ListObjectsV2Command({
        Bucket: TEST_BUCKET,
      }),
    )

    if (!listedObjects?.Contents?.length) {
      return
    }

    const deleteParams: AWS.DeleteObjectsCommandInput = {
      Bucket: TEST_BUCKET,
      Delete: { Objects: listedObjects.Contents.map(({ Key }) => ({ Key })) },
    }

    const deleteResult = await client.send(new AWS.DeleteObjectsCommand(deleteParams))
    if (deleteResult.Errors?.length) {
      throw new Error(JSON.stringify(deleteResult.Errors))
    }
  }

  async function verifyUploads({
    collectionSlug,
    uploadId,
    prefix = '',
  }: {
    collectionSlug: string
    prefix?: string
    uploadId: number | string
  }) {
    const uploadData = (await payload.findByID({
      collection: collectionSlug as CollectionSlug,
      id: uploadId,
    })) as unknown as { filename: string; sizes: Record<string, { filename: string }> }

    const fileKeys = Object.keys(uploadData.sizes || {}).map((key) => {
      const rawFilename = uploadData?.sizes?.[key]?.filename
      return prefix ? `${prefix}/${rawFilename}` : rawFilename
    })

    fileKeys.push(`${prefix ? `${prefix}/` : ''}${uploadData.filename}`)
    try {
      for (const key of fileKeys) {
        const { $metadata } = await client.send(
          new AWS.HeadObjectCommand({ Bucket: TEST_BUCKET, Key: key }),
        )

        if ($metadata.httpStatusCode !== 200) {
          console.error('Error verifying uploads', key, $metadata)
          throw new Error(`Error verifying uploads: ${key}, ${$metadata.httpStatusCode}`)
        }

        // Verify each size was properly uploaded
        expect($metadata.httpStatusCode).toBe(200)
      }
    } catch (error: unknown) {
      console.error('Error verifying uploads:', fileKeys, error)
      throw error
    }
  }
})
