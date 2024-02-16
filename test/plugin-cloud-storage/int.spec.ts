/* eslint-disable jest/require-top-level-describe */
import * as AWS from '@aws-sdk/client-s3'
import path from 'path'

import payload from '../../packages/payload/src'
import { describeIfInCIOrHasLocalstack } from '../helpers'
import { initPayloadTest } from '../helpers/configHelpers'

const TEST_BUCKET = 'payload-bucket'

let client: AWS.S3Client
describeIfInCIOrHasLocalstack()('plugin-cloud-storage', () => {
  describe('S3', () => {
    beforeAll(async () => {
      client = new AWS.S3({
        endpoint: 'http://localhost:4566',
        region: 'us-east-1',
        forcePathStyle: true, // required for localstack
      })

      await createTestBucket()

      await initPayloadTest({ __dirname, init: { local: true } })
    })

    afterEach(async () => {
      await clearTestBucket()
    })

    it('can upload', async () => {
      const upload = await payload.create({
        collection: 'media',
        data: {},
        filePath: path.resolve(__dirname, '../uploads/image.png'),
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
