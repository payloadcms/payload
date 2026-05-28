import type { Payload } from 'payload'

import * as AWS from '@aws-sdk/client-s3'
import { readFileSync } from 'fs'
import path from 'path'
import { assert } from 'ts-essentials'
import { fileURLToPath } from 'url'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'

import type { NextRESTClient } from '../../__helpers/shared/NextRESTClient.js'

import { initPayloadInt } from '../../__helpers/shared/initPayloadInt.js'
import {
  clearTestBucket,
  createTestBucket,
  getAWSClient,
  getTestBucketName,
  MB,
} from '../test-utils.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

let restClient: NextRESTClient
let payload: Payload

const signedURLEndpoint = '/storage-s3-generate-signed-url'

const signedURLBody = (
  collectionSlug: string,
  filename: string,
  filesize: number,
  mimeType: string,
) =>
  JSON.stringify({
    collectionSlug,
    filename,
    filesize,
    mimeType,
  })

describe('@payloadcms/storage-s3 clientUploads', () => {
  beforeAll(async () => {
    ;({ payload, restClient } = await initPayloadInt(dirname))

    await createTestBucket()
    await clearTestBucket()
  })

  it('should generate a signed upload URL', async () => {
    const file = readFileSync(path.resolve(dirname, '../../uploads/image.png'))

    const { url } = await restClient
      .POST(signedURLEndpoint, {
        body: signedURLBody('media', 'image.png', file.length, 'image/png'),
      })
      .then((res) => res.json<{ url: string }>())

    expect(url).toBeDefined()

    const uploadResponse = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'image/png',
        'Content-Length': String(file.length),
      },
      body: file,
    })

    expect(uploadResponse.ok).toBe(true)

    const res = await getAWSClient()
      .headObject({
        Bucket: getTestBucketName(),
        Key: 'image.png',
      })
      .catch((e) => {
        console.error(e)
        return null
      })

    expect(res).not.toBeNull()
    assert(res)
    expect(res.ContentLength).toBe(file.length)
    expect(res.ContentType).toBe('image/png')
  })

  it("should reject signed URL generation by access control when 'x-disallow-access' header is set", async () => {
    const response = await restClient.POST(signedURLEndpoint, {
      headers: {
        'x-disallow-access': 'true',
      },
      body: signedURLBody('media', 'image.png', MB(1), 'image/png'),
    })

    expect(response.status).toBe(403)
  })

  it('should generate signed URL for file within size limit', async () => {
    const response = await restClient.POST(signedURLEndpoint, {
      body: signedURLBody('media', 'small-file.png', 500_000, 'image/png'),
    })

    expect(response.status).toBe(200)
    const { url } = (await response.json()) as any
    expect(url).toBeDefined()
    expect(url).toContain(getTestBucketName())
    expect(url).toContain('small-file.png')
  })

  it('should reject file exceeding size limit', async () => {
    const response = await restClient.POST(signedURLEndpoint, {
      body: signedURLBody('media', 'large-file.png', MB(11), 'image/png'),
    })

    expect(response.status).toBe(400)
    const { errors } = (await response.json()) as any
    expect(errors).toBeDefined()
    expect(errors[0].message).toContain('Exceeded file size limit')
    expect(errors[0].message).toMatch(/Limit: 10\.0\dMB/)
    expect(errors[0].message).toMatch(/got: 11\.0\dMB/)
  })

  it('should reject file exactly at limit boundary', async () => {
    const response = await restClient.POST(signedURLEndpoint, {
      body: signedURLBody('media', 'boundary-file.png', MB(10.1), 'image/png'),
    })

    expect(response.status).toBe(400)
    const { errors } = (await response.json()) as any
    expect(errors).toBeDefined()
    expect(errors[0].message).toContain('Exceeded file size limit')
  })

  it('should accept file exactly at limit', async () => {
    const response = await restClient.POST(signedURLEndpoint, {
      body: signedURLBody('media', 'exact-limit.png', MB(10), 'image/png'),
    })

    expect(response.status).toBe(200)
    const { url } = (await response.json()) as any
    expect(url).toBeDefined()
  })

  it('should not allow bypassing with passing a smaller file size but uploading a larger file', async () => {
    const declaredFilesize = MB(5)
    const actualFilesize = MB(15)
    const mimeType = 'text/plain'

    const buffer = Buffer.alloc(actualFilesize, 0)
    const file = new Blob([buffer], { type: mimeType })

    const { url } = await restClient
      .POST(signedURLEndpoint, {
        body: signedURLBody('media', 'bypass-file.png', declaredFilesize, mimeType),
      })
      .then((res) => res.json<{ url: string }>())

    expect(url).toBeDefined()

    const uploadResponse = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': mimeType,
        'Content-Length': String(actualFilesize),
      },
      body: file,
    })

    if (process.env.S3_ENDPOINT?.includes('localhost')) {
      console.warn(
        'Skipping assertion for localstack local S3 endpoint, which does not enforce content-length limits on signed URLs',
      )
      return
    }

    expect(uploadResponse.ok).toBe(false)
    expect(uploadResponse.status).toBe(403)
  })

  describe('multipart actions', () => {
    it('should initiate multipart upload and return a stable response shape', async () => {
      const response = await restClient.POST(signedURLEndpoint, {
        body: JSON.stringify({
          action: 'initiateMultipart',
          collectionSlug: 'media',
          filename: 'multipart-initiate.png',
          filesize: MB(6),
          mimeType: 'image/png',
          partSize: MB(5),
        }),
      })

      expect(response.status).toBe(200)
      const body = await response.json()

      expect(body.action).toBe('initiateMultipart')
      expect(body.ok).toBe(true)
      expect(body.key).toContain('multipart-initiate.png')
      expect(body.partCount).toBe(2)
      expect(body.partSize).toBe(MB(5))
      expect(body.uploadId).toBeDefined()
    })

    it('should reject multipart initiate for invalid filesize', async () => {
      const response = await restClient.POST(signedURLEndpoint, {
        body: JSON.stringify({
          action: 'initiateMultipart',
          collectionSlug: 'media',
          filename: 'invalid-size.png',
          filesize: 0,
          mimeType: 'image/png',
        }),
      })

      expect(response.status).toBe(400)
      const { errors } = (await response.json()) as any
      expect(errors[0].message).toContain('valid filesize is required to initiate multipart upload')
    })

    it('should reject multipart part signing for invalid part number', async () => {
      const response = await restClient.POST(signedURLEndpoint, {
        body: JSON.stringify({
          action: 'signMultipartPart',
          collectionSlug: 'media',
          key: 'fake-key',
          partNumber: 0,
          uploadId: 'fake-upload-id',
        }),
      })

      expect(response.status).toBe(400)
      const { errors } = (await response.json()) as any
      expect(errors[0].message).toContain('valid partNumber')
    })

    it('should complete multipart upload and normalize unsorted parts', async () => {
      const initiate = await restClient
        .POST(signedURLEndpoint, {
          body: JSON.stringify({
            action: 'initiateMultipart',
            collectionSlug: 'media',
            filename: 'multipart-complete.png',
            filesize: MB(6),
            mimeType: 'image/png',
            partSize: MB(5),
          }),
        })
        .then((res) =>
          res.json<{
            action: string
            key: string
            partCount: number
            uploadId: string
          }>(),
        )

      const partUploadResults: { ETag: string; PartNumber: number }[] = []

      for (let partNumber = 1; partNumber <= initiate.partCount; partNumber++) {
        const partSign = await restClient
          .POST(signedURLEndpoint, {
            body: JSON.stringify({
              action: 'signMultipartPart',
              collectionSlug: 'media',
              key: initiate.key,
              partNumber,
              uploadId: initiate.uploadId,
            }),
          })
          .then((res) => res.json<{ url: string }>())

        const chunk = Buffer.alloc(MB(5), partNumber)
        const uploadResponse = await fetch(partSign.url, {
          body: chunk,
          method: 'PUT',
        })

        expect(uploadResponse.ok).toBe(true)
        const etag = uploadResponse.headers.get('etag')
        expect(etag).toBeDefined()
        partUploadResults.push({
          ETag: etag!,
          PartNumber: partNumber,
        })
      }

      const reversedParts = [...partUploadResults].reverse()
      const complete = await restClient
        .POST(signedURLEndpoint, {
          body: JSON.stringify({
            action: 'completeMultipart',
            collectionSlug: 'media',
            key: initiate.key,
            parts: reversedParts,
            uploadId: initiate.uploadId,
          }),
        })
        .then((res) =>
          res.json<{
            action: string
            key: string
            ok: boolean
            partCount: number
            uploadId: string
          }>(),
        )

      expect(complete.action).toBe('completeMultipart')
      expect(complete.ok).toBe(true)
      expect(complete.partCount).toBe(initiate.partCount)
      expect(complete.key).toBe(initiate.key)
      expect(complete.uploadId).toBe(initiate.uploadId)
    })

    it('should allow cleanup via abort after multipart completion failure', async () => {
      const initiate = await restClient
        .POST(signedURLEndpoint, {
          body: JSON.stringify({
            action: 'initiateMultipart',
            collectionSlug: 'media',
            filename: 'multipart-failure-cleanup.png',
            filesize: MB(6),
            mimeType: 'image/png',
            partSize: MB(5),
          }),
        })
        .then((res) =>
          res.json<{
            key: string
            uploadId: string
          }>(),
        )

      const failedComplete = await restClient.POST(signedURLEndpoint, {
        body: JSON.stringify({
          action: 'completeMultipart',
          collectionSlug: 'media',
          key: initiate.key,
          parts: [],
          uploadId: initiate.uploadId,
        }),
      })

      expect(failedComplete.status).toBe(400)

      await restClient.POST(signedURLEndpoint, {
        body: JSON.stringify({
          action: 'abortMultipart',
          collectionSlug: 'media',
          key: initiate.key,
          uploadId: initiate.uploadId,
        }),
      })

      const multipartUploads = await getAWSClient().send(
        new AWS.ListMultipartUploadsCommand({
          Bucket: getTestBucketName(),
          Prefix: initiate.key,
        }),
      )

      const matchedUpload = multipartUploads.Uploads?.find(
        (upload) => upload.Key === initiate.key && upload.UploadId === initiate.uploadId,
      )
      expect(matchedUpload).toBeUndefined()
    })

    it('should abort multipart upload and remove pending upload', async () => {
      const initiate = await restClient
        .POST(signedURLEndpoint, {
          body: JSON.stringify({
            action: 'initiateMultipart',
            collectionSlug: 'media',
            filename: 'multipart-abort.png',
            filesize: MB(6),
            mimeType: 'image/png',
            partSize: MB(5),
          }),
        })
        .then((res) =>
          res.json<{
            key: string
            uploadId: string
          }>(),
        )

      const abortResponse = await restClient
        .POST(signedURLEndpoint, {
          body: JSON.stringify({
            action: 'abortMultipart',
            collectionSlug: 'media',
            key: initiate.key,
            uploadId: initiate.uploadId,
          }),
        })
        .then((res) =>
          res.json<{
            action: string
            key: string
            ok: boolean
            uploadId: string
          }>(),
        )

      expect(abortResponse.action).toBe('abortMultipart')
      expect(abortResponse.ok).toBe(true)
      expect(abortResponse.key).toBe(initiate.key)
      expect(abortResponse.uploadId).toBe(initiate.uploadId)

      const multipartUploads = await getAWSClient().send(
        new AWS.ListMultipartUploadsCommand({
          Bucket: getTestBucketName(),
          Prefix: initiate.key,
        }),
      )

      const matchedUpload = multipartUploads.Uploads?.find(
        (upload) => upload.Key === initiate.key && upload.UploadId === initiate.uploadId,
      )
      expect(matchedUpload).toBeUndefined()
    })
  })

  describe('filename handling', () => {
    it('should sanitize special characters in filename', async () => {
      const file = readFileSync(path.resolve(dirname, '../../uploads/image.png'))

      const { url } = await restClient
        .POST(signedURLEndpoint, {
          body: signedURLBody('media-with-prefix', '../photo.png', file.length, 'image/png'),
        })
        .then((res) => res.json<{ url: string }>())

      expect(url).toBeDefined()
      expect(url).toContain('test-prefix')
      expect(url).toContain('photo.png')
      expect(url).not.toContain('..')
    })

    it('should sanitize deeply nested special characters in filename', async () => {
      const file = readFileSync(path.resolve(dirname, '../../uploads/image.png'))

      const { url } = await restClient
        .POST(signedURLEndpoint, {
          body: signedURLBody(
            'media-with-prefix',
            '../../other-prefix/document.js',
            file.length,
            'image/png',
          ),
        })
        .then((res) => res.json<{ url: string }>())

      expect(url).toBeDefined()
      expect(url).toContain('test-prefix')
      expect(url).toContain('document.js')
      expect(url).not.toContain('..')
      expect(url).not.toContain('other-prefix')
    })

    it('should sanitize backslash characters in filename', async () => {
      const file = readFileSync(path.resolve(dirname, '../../uploads/image.png'))

      const { url } = await restClient
        .POST(signedURLEndpoint, {
          body: signedURLBody('media-with-prefix', '..\\..\\photo.png', file.length, 'image/png'),
        })
        .then((res) => res.json<{ url: string }>())

      expect(url).toBeDefined()
      expect(url).toContain('test-prefix')
      expect(url).toContain('photo.png')
      expect(url).not.toContain('..')
    })

    it('should allow normal filenames with prefix', async () => {
      const file = readFileSync(path.resolve(dirname, '../../uploads/image.png'))

      const { url } = await restClient
        .POST(signedURLEndpoint, {
          body: signedURLBody('media-with-prefix', 'safe-image.png', file.length, 'image/png'),
        })
        .then((res) => res.json<{ url: string }>())

      expect(url).toBeDefined()
      expect(url).toContain('test-prefix')
      expect(url).toContain('safe-image.png')
    })
  })

  afterAll(async () => {
    await payload.destroy()
  })

  afterEach(async () => {
    await clearTestBucket()
  })
})
