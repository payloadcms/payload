import type { Payload } from 'payload'

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
