import type { Payload } from 'payload'

import { readFileSync } from 'fs'
import path from 'path'
import { assert } from 'ts-essentials'
import { fileURLToPath } from 'url'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'

import type { NextRESTClient } from '../helpers/NextRESTClient.js'

import { initPayloadInt } from '../helpers/initPayloadInt.js'
import {
  clearTestBucket,
  createTestBucket,
  getAWSClient,
  getTestBucketName,
  MB,
} from './test-utils.js'

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
    ;({ payload, restClient } = await initPayloadInt(
      dirname,
      undefined,
      undefined,
      path.resolve(dirname, 'clientUploads.config.ts'),
    ))

    await createTestBucket()
    await clearTestBucket()
  })

  it('should generate a signed upload URL', async () => {
    const file = readFileSync(path.resolve(dirname, '../uploads/image.png'))

    const { url } = await restClient
      .POST(signedURLEndpoint, {
        body: signedURLBody('media', 'image.png', file.length, 'image/png'),
      })
      .then((res) => res.json<{ url: string }>())

    expect(url).toBeDefined()

    // Upload the file to S3 using the signed URL
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
    const filename = 'small-file.png'
    const filesize = 500_000 // 500KB (within 1MB limit)
    const mimeType = 'image/png'

    const response = await restClient.POST(signedURLEndpoint, {
      body: signedURLBody('media', filename, filesize, mimeType),
    })

    expect(response.status).toBe(200)
    const { url } = (await response.json()) as any
    expect(url).toBeDefined()
    expect(url).toContain(getTestBucketName())
    expect(url).toContain(filename)
  })

  it('should reject file exceeding size limit', async () => {
    const filename = 'large-file.png'
    const filesize = MB(11) // exceeds 10MB limit
    const mimeType = 'image/png'

    const response = await restClient.POST(signedURLEndpoint, {
      body: signedURLBody('media', filename, filesize, mimeType),
    })

    expect(response.status).toBe(400)
    const { errors } = (await response.json()) as any
    expect(errors).toBeDefined()
    expect(errors[0].message).toContain('Exceeded file size limit')
    expect(errors[0].message).toMatch(/Limit: 10\.0\dMB/) // 10,000,000 bytes = 10.0MB
    expect(errors[0].message).toMatch(/got: 11\.0\dMB/) // 11,000,000 bytes = 11.0MB
  })

  it('should reject file exactly at limit boundary', async () => {
    const filename = 'boundary-file.png'
    const filesize = MB(10.1) // Just over 10MB limit
    const mimeType = 'image/png'

    const response = await restClient.POST(signedURLEndpoint, {
      body: signedURLBody('media', filename, filesize, mimeType),
    })

    expect(response.status).toBe(400)
    const { errors } = (await response.json()) as any
    expect(errors).toBeDefined()
    expect(errors[0].message).toContain('Exceeded file size limit')
  })

  it('should accept file exactly at limit', async () => {
    const filename = 'exact-limit.png'
    const filesize = MB(10) // Exactly 10MB
    const mimeType = 'image/png'

    const response = await restClient.POST(signedURLEndpoint, {
      body: signedURLBody('media', filename, filesize, mimeType),
    })

    expect(response.status).toBe(200)
    const { url } = (await response.json()) as any
    expect(url).toBeDefined()
  })

  it('should not allow bypassing with passing a smaller file size but uploading a larger file', async () => {
    const filename = 'bypass-file.png'
    const declaredFilesize = MB(5) // Declare 5MB
    const actualFilesize = MB(15) // But actually upload 15MB
    const mimeType = 'text/plain'

    const buffer = Buffer.alloc(actualFilesize, 0)
    const file = new Blob([buffer], { type: mimeType })

    const { url } = await restClient
      .POST(signedURLEndpoint, {
        body: signedURLBody('media', filename, declaredFilesize, mimeType),
      })
      .then((res) => res.json<{ url: string }>())

    expect(url).toBeDefined()

    // Attempt to upload the larger file to S3 using the signed URL
    const uploadResponse = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': mimeType,
        'Content-Length': String(actualFilesize),
      },
      body: file,
    })

    // Expect the upload to be rejected
    expect(uploadResponse.ok).toBe(false)
    expect(uploadResponse.status).toBe(403) // S3 should reject the upload
  })

  afterAll(async () => {
    await payload.destroy()
  })

  afterEach(async () => {
    await clearTestBucket()
  })
})
