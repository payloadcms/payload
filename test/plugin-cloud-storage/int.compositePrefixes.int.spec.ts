/* eslint vitest/no-standalone-expect: ["error", { "additionalTestBlockFunctions": ["test", "test.options"] }] -- Tests use the shared fixture wrapper. */
import type { SuiteAPI } from 'vitest'

import * as AWS from '@aws-sdk/client-s3'
import path from 'path'
import shelljs from 'shelljs'
import { fileURLToPath } from 'url'
import { expect } from 'vitest'

import { test } from '../__helpers/int/vitest.js'
import { collectionPrefix, mediaWithCompositePrefixesSlug } from './shared.js'
import { clearTestBucket, createTestBucket } from './utils.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

function describeIfInCIOrHasLocalstack(): SuiteAPI | SuiteAPI['skip'] {
  if (process.env.CI) {
    return test.describe
  }

  const { code } = shelljs.exec(`docker ps | grep localstack`)

  if (code !== 0) {
    console.warn('Localstack is not running. Skipping test suite.')
    return test.describe.skip
  }

  console.log('Localstack is running. Running test suite.')

  return test.describe
}

const configPath = './config.compositePrefixes.ts'

test.suite('@payloadcms/plugin-cloud-storage (composite prefixes)', { config: configPath }, () => {
  let TEST_BUCKET: string

  test.beforeEach(() => {
    TEST_BUCKET = process.env.S3_BUCKET!
  })

  let client: AWS.S3Client

  describeIfInCIOrHasLocalstack()('S3 composite prefixes', () => {
    test.describe('S3', () => {
      test.beforeAll(async () => {
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

      test.afterEach(async () => {
        await clearTestBucket(client)
      })

      test('can upload with composite prefixes (collection + doc prefix)', async ({ payload }) => {
        const docPrefix = 'user-123'

        const upload = await payload.create({
          collection: mediaWithCompositePrefixesSlug,
          data: {
            prefix: docPrefix,
          },
          filePath: path.resolve(dirname, '../uploads/image.png'),
          overrideAccess: true,
        })

        expect(upload.id).toBeTruthy()

        const stored = await payload.db.findOne({
          collection: mediaWithCompositePrefixesSlug,
          where: { id: { equals: upload.id } },
        })
        const expectedKey = stored?._managedFiles?.find((file) =>
          file.roles.some((role) => role.type === 'default'),
        )?.key

        expect(expectedKey?.split('/')).toEqual([
          collectionPrefix,
          docPrefix,
          expect.stringMatching(/^[0-9a-f-]+$/),
          upload.filename,
        ])

        const { $metadata } = await client.send(
          new AWS.HeadObjectCommand({ Bucket: TEST_BUCKET, Key: expectedKey }),
        )

        expect($metadata.httpStatusCode).toBe(200)

        expect(upload.url).toEqual(
          `/api/${mediaWithCompositePrefixesSlug}/file/${String(upload.filename)}?prefix=${docPrefix}`,
        )
        expect(upload.original?.url).toBe(upload.url)
      })

      test('can upload with composite prefixes (collection prefix only)', async ({ payload }) => {
        const upload = await payload.create({
          collection: mediaWithCompositePrefixesSlug,
          data: {},
          filePath: path.resolve(dirname, '../uploads/image.png'),
          overrideAccess: true,
        })

        expect(upload.id).toBeTruthy()

        const stored = await payload.db.findOne({
          collection: mediaWithCompositePrefixesSlug,
          where: { id: { equals: upload.id } },
        })
        const expectedKey = stored?._managedFiles?.find((file) =>
          file.roles.some((role) => role.type === 'default'),
        )?.key

        expect(expectedKey?.split('/')).toEqual([
          collectionPrefix,
          expect.stringMatching(/^[0-9a-f-]+$/),
          upload.filename,
        ])

        const { $metadata } = await client.send(
          new AWS.HeadObjectCommand({ Bucket: TEST_BUCKET, Key: expectedKey }),
        )

        expect($metadata.httpStatusCode).toBe(200)
      })
    })
  })
})
