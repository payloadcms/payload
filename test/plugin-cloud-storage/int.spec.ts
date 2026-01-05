import type { Payload } from 'payload'
import type { SuiteAPI } from 'vitest'

import * as AWS from '@aws-sdk/client-s3'
import path from 'path'
import shelljs from 'shelljs'
import { fileURLToPath } from 'url'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'

import type { Config } from './payload-types.js'

import { initPayloadInt } from '../helpers/initPayloadInt.js'
import { mediaSlug, mediaWithPrefixSlug, prefix, restrictedMediaSlug } from './shared.js'
import { clearTestBucket, createTestBucket } from './utils.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

let payload: Payload

// needs to be here as it imports vitest functions and conflicts with playwright that uses jest
export function describeIfInCIOrHasLocalstack(): SuiteAPI | SuiteAPI['skip'] {
  if (process.env.CI) {
    return describe
  }

  // Check that localstack is running
  const { code } = shelljs.exec(`docker ps | grep localstack`)

  if (code !== 0) {
    console.warn('Localstack is not running. Skipping test suite.')
    return describe.skip
  }

  console.log('Localstack is running. Running test suite.')

  return describe
}

describe('@payloadcms/plugin-cloud-storage', () => {
  let TEST_BUCKET: string

  beforeAll(async () => {
    ;({ payload } = await initPayloadInt(dirname))
    TEST_BUCKET = process.env.S3_BUCKET
  })

  afterAll(async () => {
    await payload.destroy()
  })

  let client: AWS.S3Client
  describeIfInCIOrHasLocalstack()('plugin-cloud-storage', () => {
    describe('S3', () => {
      beforeAll(async () => {
        client = new AWS.S3({
          endpoint: process.env.S3_ENDPOINT,
          forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true',
          region: process.env.S3_REGION,
          credentials: {
            accessKeyId: process.env.S3_ACCESS_KEY_ID,
            secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
          },
        })

        await createTestBucket()
        await clearTestBucket(client)
      })

      afterEach(async () => {
        await clearTestBucket(client)
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

      it('should not upload to S3 when mimeType validation fails', async () => {
        // Get initial bucket contents
        const listBefore = await client.send(new AWS.ListObjectsV2Command({ Bucket: TEST_BUCKET }))
        const fileCountBefore = listBefore.Contents?.length || 0

        // Try to upload a JSON file to a collection that only accepts PNG
        await expect(
          payload.create({
            collection: restrictedMediaSlug,
            data: {},
            filePath: path.resolve(dirname, './test.json'),
          }),
        ).rejects.toThrow()

        // Verify no new files were uploaded to S3
        const listAfter = await client.send(new AWS.ListObjectsV2Command({ Bucket: TEST_BUCKET }))
        const fileCountAfter = listAfter.Contents?.length || 0

        expect(fileCountAfter).toBe(fileCountBefore)
      })

      it('should upload to S3 when mimeType validation passes', async () => {
        // Upload a valid PNG file
        const upload = await payload.create({
          collection: restrictedMediaSlug,
          data: {},
          filePath: path.resolve(dirname, './image.png'),
        })

        expect(upload.id).toBeTruthy()

        // Verify the file was uploaded to S3
        const { $metadata } = await client.send(
          new AWS.HeadObjectCommand({
            Bucket: TEST_BUCKET,
            Key: upload.filename,
          }),
        )

        expect($metadata.httpStatusCode).toBe(200)
      })
    })
  })

  describe('Azure', () => {
    it.todo('can upload')
  })

  describe('GCS', () => {
    it.todo('can upload')
  })

  describe('R2', () => {
    it.todo('can upload')
  })

  async function verifyUploads({
    collectionSlug,
    uploadId,
    prefix = '',
  }: {
    collectionSlug: keyof Config['collections']
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
