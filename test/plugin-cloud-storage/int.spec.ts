/* eslint-disable jest/require-top-level-describe */
import * as AWS from '@aws-sdk/client-s3'
import path from 'path'
import { fileURLToPath } from 'url'

import type { Payload } from '../../packages/payload/src/index.js'

import { getPayload } from '../../packages/payload/src/index.js'
import { describeIfInCIOrHasLocalstack } from '../helpers.js'
import { startMemoryDB } from '../startMemoryDB.js'
import configPromise from './config.js'
const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

let payload: Payload

describe('@payloadcms/plugin-cloud-storage', () => {
  beforeAll(async () => {
    const config = await startMemoryDB(configPromise)
    payload = await getPayload({ config })
  })
  const TEST_BUCKET = 'payload-bucket'

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
      })

      afterEach(async () => {
        await clearTestBucket()
      })

      it('can upload', async () => {
        const upload = await payload.create({
          collection: 'media',
          data: {},
          filePath: path.resolve(dirname, '../uploads/image.png'),
        })

        expect(upload.id).toBeTruthy()

        await verifyUploads(upload.id)
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

  async function createTestBucket() {
    const makeBucketRes = await client.send(new AWS.CreateBucketCommand({ Bucket: TEST_BUCKET }))

    if (makeBucketRes.$metadata.httpStatusCode !== 200) {
      throw new Error(`Failed to create bucket. ${makeBucketRes.$metadata.httpStatusCode}`)
    }
  }

  async function clearTestBucket() {
    const listedObjects = await client.send(
      new AWS.ListObjectsV2Command({
        Bucket: TEST_BUCKET,
      }),
    )

    if (!listedObjects?.Contents?.length) return

    const deleteParams = {
      Bucket: TEST_BUCKET,
      Delete: { Objects: [] },
    }

    listedObjects.Contents.forEach(({ Key }) => {
      deleteParams.Delete.Objects.push({ Key })
    })

    const deleteResult = await client.send(new AWS.DeleteObjectsCommand(deleteParams))
    if (deleteResult.Errors?.length) {
      throw new Error(JSON.stringify(deleteResult.Errors))
    }
  }

  async function verifyUploads(uploadId: number | string) {
    try {
      const uploadData = (await payload.findByID({
        collection: 'media',
        id: uploadId,
      })) as unknown as { filename: string; sizes: Record<string, { filename: string }> }

      const fileKeys = Object.keys(uploadData.sizes).map((key) => uploadData.sizes[key].filename)
      fileKeys.push(uploadData.filename)

      for (const key of fileKeys) {
        const { $metadata } = await client.send(
          new AWS.HeadObjectCommand({ Bucket: TEST_BUCKET, Key: key }),
        )

        // Verify each size was properly uploaded
        expect($metadata.httpStatusCode).toBe(200)
      }
    } catch (error: unknown) {
      console.error('Error verifying uploads:', error)
      throw error
    }
  }
})
