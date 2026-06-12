import type { Payload } from 'payload'
import type { SuiteAPI } from 'vitest'

import * as AWS from '@aws-sdk/client-s3'
import path from 'path'
import shelljs from 'shelljs'
import { fileURLToPath } from 'url'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'

import { initPayloadInt } from '../__helpers/shared/initPayloadInt.js'
import { collectionPrefix, mediaWithCompositePrefixesSlug } from './shared.js'
import { clearTestBucket, createTestBucket } from './utils.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

function describeIfInCIOrHasLocalstack(): SuiteAPI | SuiteAPI['skip'] {
  if (process.env.CI) {
    return describe
  }

  const { code } = shelljs.exec(`docker ps | grep localstack`)

  if (code !== 0) {
    console.warn('Localstack is not running. Skipping test suite.')
    return describe.skip
  }

  console.log('Localstack is running. Running test suite.')

  return describe
}

describe('@payloadcms/plugin-cloud-storage (composite prefixes)', () => {
  let payload: Payload
  let TEST_BUCKET: string

  beforeAll(async () => {
    ;({ payload } = await initPayloadInt(dirname, undefined, true, 'config.compositePrefixes.ts'))
    TEST_BUCKET = process.env.S3_BUCKET!
  })

  afterAll(async () => {
    await payload.destroy()
  })

  let client: AWS.S3Client

  describeIfInCIOrHasLocalstack()('S3 composite prefixes', () => {
    describe('S3', () => {
      beforeAll(async () => {
        client = new AWS.S3({
          credentials: {
            accessKeyId: process.env.S3_ACCESS_KEY_ID!,
            secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
          },
          endpoint: process.env.S3_ENDPOINT!,
          forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true',
          region: process.env.S3_REGION!,
        })

        await createTestBucket()
        await clearTestBucket(client)
      })

      afterEach(async () => {
        await clearTestBucket(client)
      })

      it('can upload with composite prefixes (collection + doc prefix)', async () => {
        const docPrefix = 'user-123'

        const upload = await payload.create({
          collection: mediaWithCompositePrefixesSlug,
          data: {
            prefix: docPrefix,
          },
          filePath: path.resolve(dirname, '../uploads/image.png'),
        })

        expect(upload.id).toBeTruthy()

        const expectedKey = `${collectionPrefix}/${docPrefix}/${upload.filename}`

        const { $metadata } = await client.send(
          new AWS.HeadObjectCommand({ Bucket: TEST_BUCKET, Key: expectedKey }),
        )

        expect($metadata.httpStatusCode).toBe(200)

        expect(upload.url).toEqual(
          `/api/${mediaWithCompositePrefixesSlug}/file/${String(upload.filename)}?prefix=${docPrefix}`,
        )
      })

      it('can upload with composite prefixes (collection prefix only)', async () => {
        const upload = await payload.create({
          collection: mediaWithCompositePrefixesSlug,
          data: {},
          filePath: path.resolve(dirname, '../uploads/image.png'),
        })

        expect(upload.id).toBeTruthy()

        const expectedKey = `${collectionPrefix}/${upload.filename}`

        const { $metadata } = await client.send(
          new AWS.HeadObjectCommand({ Bucket: TEST_BUCKET, Key: expectedKey }),
        )

        expect($metadata.httpStatusCode).toBe(200)
      })
    })
  })
})
