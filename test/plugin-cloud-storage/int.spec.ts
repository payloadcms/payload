import type { Payload } from 'payload'
import type { SuiteAPI } from 'vitest'

import * as AWS from '@aws-sdk/client-s3'
import path from 'path'
import shelljs from 'shelljs'
import { fileURLToPath } from 'url'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'

import type { Config } from './payload-types.js'

import { initPayloadInt } from '@tools/test-utils/int'
import {
  mediaSlug,
  mediaWithPrefixSlug,
  prefix,
  restrictedMediaSlug,
  testMetadataSlug,
} from './shared.js'
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

      it('should store correct URLs for sized images', async () => {
        const upload = await payload.create({
          collection: mediaSlug,
          data: {},
          filePath: path.resolve(dirname, '../uploads/image.png'),
        })

        const apiResponse = await payload.findByID({
          collection: mediaSlug,
          id: upload.id,
        })
        expect(apiResponse.sizes).toBeTruthy()

        const apiSizeKeys = Object.keys(apiResponse.sizes || {})
        for (const sizeKey of apiSizeKeys) {
          const size = apiResponse.sizes?.[sizeKey as keyof typeof apiResponse.sizes]
          if (!size) {
            continue
          }

          expect(size.url).toEqual(`/api/${mediaSlug}/file/${size.filename}`)
        }

        const rawDbData = await payload.db.findOne({
          collection: mediaSlug,
          where: { id: { equals: upload.id } },
        })
        expect(rawDbData).toBeTruthy()

        const dbRecord = rawDbData as unknown as {
          filename: string
          sizes: Record<string, { filename: string; url: string }>
          url: string
        }
        type SizeData = { filename: string; url: string }

        const sizeKeys = Object.keys(dbRecord.sizes)
        expect(sizeKeys.length).toBeGreaterThan(0)

        for (const sizeKey of sizeKeys) {
          const size: SizeData = dbRecord.sizes[sizeKey] as SizeData
          expect(size.url).not.toEqual(`/api/${mediaSlug}/file/${dbRecord.filename}`)
          expect(size.url).toEqual(`/api/${mediaSlug}/file/${size.filename}`)
        }
      })

      it('should handle collections without imageSizes correctly', async () => {
        const upload = await payload.create({
          collection: mediaWithPrefixSlug,
          data: {},
          filePath: path.resolve(dirname, '../uploads/image.png'),
        })

        expect(upload.filename).toBeTruthy()
        expect(upload.url).toEqual(`/api/${mediaWithPrefixSlug}/file/${upload.filename}`)
        expect((upload as any).sizes).toBeFalsy()

        const rawDbData = await payload.db.findOne({
          collection: mediaWithPrefixSlug,
          where: { id: { equals: upload.id } },
        })

        expect(rawDbData).toBeTruthy()

        const dbRecord = rawDbData as unknown as {
          filename: string
          url: string
        }

        expect(dbRecord.filename).toEqual(upload.filename)
        expect(dbRecord.url).toEqual(`/api/${mediaWithPrefixSlug}/file/${upload.filename}`)
        expect((rawDbData as any)?.sizes).toBeFalsy()
      })
    })
  })

  describe('External data persistence', () => {
    const createdIDs: (number | string)[] = []

    afterEach(async () => {
      for (const id of createdIDs) {
        try {
          await payload.delete({ collection: testMetadataSlug, id })
        } catch (e) {
          // Ignore
        }
      }
      createdIDs.length = 0
    })

    it('should automatically persist metadata returned by custom adapters', async () => {
      const upload = await payload.create({
        collection: testMetadataSlug,
        data: {
          testNote: 'Testing automatic metadata persistence',
        },
        filePath: path.resolve(dirname, '../uploads/image.png'),
      })

      createdIDs.push(upload.id)

      expect(upload.id).toBeTruthy()
      expect(upload.filename).toBeTruthy()
      expect(upload.testNote).toBe('Testing automatic metadata persistence')

      // Our afterChange hook should automatically persist whatever metadata the adapter returns
      expect(upload.customStorageId).toBeTruthy()
      expect(upload.customStorageId).toContain('storage-')
      expect(upload.uploadTimestamp).toBeTruthy()
      expect(upload.storageProvider).toBe('test-adapter')
      expect(upload.bucketName).toBe('test-bucket')
      expect(upload.objectKey).toBe(upload.filename)
      expect(upload.processingStatus).toBe('completed')
      expect(upload.uploadVersion).toBe('1.0.0')

      console.log('Test adapter metadata automatically persisted:', {
        customStorageId: upload.customStorageId,
        uploadTimestamp: upload.uploadTimestamp,
        storageProvider: upload.storageProvider,
        bucketName: upload.bucketName,
        objectKey: upload.objectKey,
        processingStatus: upload.processingStatus,
        uploadVersion: upload.uploadVersion,
      })
    })

    it('should persist metadata on update operations', async () => {
      const upload = await payload.create({
        collection: testMetadataSlug,
        data: {
          testNote: 'Testing update metadata persistence',
        },
        filePath: path.resolve(dirname, '../uploads/image.png'),
      })

      createdIDs.push(upload.id)

      const initialStorageId = upload.customStorageId
      const initialTimestamp = upload.uploadTimestamp

      const updatedUpload = await payload.update({
        collection: testMetadataSlug,
        id: upload.id,
        data: {
          testNote: 'Updated test note',
        },
        filePath: path.resolve(dirname, './image.png'),
      })

      expect(updatedUpload.testNote).toBe('Updated test note')

      // Test that metadata persistence works on updates too
      expect(updatedUpload.customStorageId).toBeTruthy()
      expect(updatedUpload.uploadTimestamp).toBeTruthy()
      expect(updatedUpload.storageProvider).toBe('test-adapter')
      expect(updatedUpload.bucketName).toBe('test-bucket')
      expect(updatedUpload.objectKey).toBe(updatedUpload.filename)
      expect(updatedUpload.processingStatus).toBe('completed')
      expect(updatedUpload.uploadVersion).toBe('1.0.0')

      const filenamesAreDifferent = upload.filename !== updatedUpload.filename
      const storageIdsAreDifferent = updatedUpload.customStorageId !== initialStorageId
      const timestampsAreDifferent = updatedUpload.uploadTimestamp !== initialTimestamp

      // If filename changed, storage ID and timestamp should also change (new upload)
      expect(filenamesAreDifferent).toBe(storageIdsAreDifferent)
      expect(filenamesAreDifferent).toBe(timestampsAreDifferent)

      console.log('Update test adapter metadata persistence:', {
        filenameChanged: filenamesAreDifferent,
        storageIdChanged: storageIdsAreDifferent,
        timestampChanged: timestampsAreDifferent,
        newStorageId: updatedUpload.customStorageId,
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
