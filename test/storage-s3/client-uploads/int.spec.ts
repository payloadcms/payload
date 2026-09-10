import type { Payload, PayloadRequest } from 'payload'

import { S3Client } from '@aws-sdk/client-s3'
import { readFileSync } from 'fs'
import path from 'path'
import { assert } from 'ts-essentials'
import { fileURLToPath } from 'url'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'

import type { NextRESTClient } from '../../__helpers/shared/NextRESTClient.js'

import { getGenerateSignedURLHandler } from '../../../packages/storage-s3/src/generateSignedURL.js'
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

it('should include the approved upload headers in the signature', async () => {
  const client = new S3Client({
    credentials: {
      accessKeyId: 'access-key',
      secretAccessKey: 'secret-key',
    },
    endpoint: 'http://127.0.0.1:4566',
    forcePathStyle: true,
    region: 'us-east-1',
  })
  const handler = getGenerateSignedURLHandler({
    bucket: 'media',
    collections: { media: true },
    getStorageClient: () => client,
  })
  const req = {
    json: () =>
      Promise.resolve({
        collectionSlug: 'media',
        filename: 'reference.png',
        filesize: 128,
        mimeType: 'image/png',
      }),
    payload: {
      collections: {
        media: {
          config: {
            slug: 'media',
            access: {},
            upload: true,
          },
        },
      },
      config: {
        upload: { limits: { fileSize: MB(10) } },
      },
      db: { findOne: () => Promise.resolve(null) },
    },
    user: { id: 'user-id' },
  } as unknown as PayloadRequest

  const response = await handler(req)
  const { url } = await response.json<{ url: string }>()
  const signedHeaders = new URL(url).searchParams.get('X-Amz-SignedHeaders')

  expect(signedHeaders?.split(';')).toContain('content-length')
  expect(signedHeaders?.split(';')).toContain('content-type')
})

it.each([
  ['missing', undefined],
  ['empty', ''],
  ['non-string', 42],
])('should validate %s MIME metadata before signing', async (_, mimeType) => {
  const client = new S3Client({
    credentials: { accessKeyId: 'access-key', secretAccessKey: 'secret-key' },
    endpoint: 'http://127.0.0.1:4566',
    forcePathStyle: true,
    region: 'us-east-1',
  })
  const handler = getGenerateSignedURLHandler({
    bucket: 'media',
    collections: { media: true },
    getStorageClient: () => client,
  })
  const req = {
    json: () =>
      Promise.resolve({
        collectionSlug: 'media',
        filename: 'reference.png',
        filesize: 128,
        ...(mimeType === undefined ? {} : { mimeType }),
      }),
    payload: {
      collections: { media: { config: { slug: 'media', access: {}, upload: true } } },
      config: {
        upload: {},
      },
      db: { findOne: () => Promise.resolve(null) },
    },
    user: { id: 'user-id' },
  } as unknown as PayloadRequest

  await expect(handler(req)).rejects.toThrow('A valid MIME type is required for client uploads.')
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
      body: file,
      headers: {
        'Content-Type': 'image/png',
        'If-None-Match': '*',
      },
      method: 'PUT',
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

  it('should reject unauthenticated client uploads', async () => {
    const response = await restClient.POST(signedURLEndpoint, {
      auth: false,
      body: signedURLBody('media', 'unauthorized.png', MB(1), 'image/png'),
    })

    expect(response.status).toBe(403)
    expect((await response.json()).url).toBeUndefined()
  })

  it('should reject client uploads without collection create or update permission', async () => {
    const response = await restClient.POST(signedURLEndpoint, {
      body: signedURLBody('media', 'forbidden.png', MB(1), 'image/png'),
      headers: {
        'x-disallow-create': 'true',
        'x-disallow-update': 'true',
      },
    })
    const body = await response.json()

    expect(response.status).toBe(403)
    expect(body.url).toBeUndefined()
    expect(body.errors).toBeDefined()
  })

  it.each(['x-disallow-create', 'x-disallow-update'])(
    'should allow client uploads when only %s is denied',
    async (deniedPermission) => {
      const response = await restClient.POST(signedURLEndpoint, {
        body: signedURLBody('media', 'allowed.png', MB(1), 'image/png'),
        headers: { [deniedPermission]: 'true' },
      })

      expect(response.status).toBe(200)
      expect((await response.json()).url).toBeDefined()
    },
  )

  it('should persist adapter-backed SVG only after document validation', async () => {
    const safeSVG =
      '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><rect width="10" height="10"/></svg>'
    const safeForm = new FormData()
    safeForm.append('_payload', JSON.stringify({ alt: 'Reference graphic' }))
    safeForm.append('file', new Blob([safeSVG], { type: 'image/svg+xml' }), 'reference.svg')

    const safeResponse = await restClient.POST('/media', { body: safeForm })
    const { doc } = await safeResponse.json()

    expect(safeResponse.status).toBe(201)
    expect(doc.filename).toBe('reference.svg')
    await expect(
      getAWSClient().headObject({ Bucket: getTestBucketName(), Key: 'reference.svg' }),
    ).resolves.toMatchObject({ ContentType: 'image/svg+xml' })

    await clearTestBucket()

    for (const file of [
      new File(
        ['<svg xmlns="http://www.w3.org/2000/svg"><script>reference()</script></svg>'],
        'reference.svg',
        { type: 'image/svg+xml' },
      ),
      new File(
        [
          '<?xml version="1.0"?><svg xmlns="http://www.w3.org/2000/svg" onload="reference()"><rect/></svg>',
        ],
        'reference.xml',
        { type: 'application/xml' },
      ),
    ]) {
      const formData = new FormData()
      formData.append('_payload', JSON.stringify({ alt: 'Reference graphic' }))
      formData.append('file', file)

      const response = await restClient.POST('/media', { body: formData })

      expect(response.status).toBe(400)
      const objects = await getAWSClient().listObjectsV2({ Bucket: getTestBucketName() })
      expect(objects.Contents).toBeUndefined()
    }
  })

  it('does not overwrite an existing object through client uploads', async () => {
    const file = readFileSync(path.resolve(dirname, '../../uploads/image.png'))
    const replacement = Buffer.alloc(file.length, 1)
    const { url } = await restClient
      .POST(signedURLEndpoint, {
        body: signedURLBody('media', 'protected.png', file.length, 'image/png'),
      })
      .then((res) => res.json<{ url: string }>())
    const upload = (body: Buffer) =>
      fetch(url, {
        body,
        headers: {
          'Content-Type': 'image/png',
          'If-None-Match': '*',
        },
        method: 'PUT',
      })

    await expect(upload(file)).resolves.toMatchObject({ ok: true })

    const overwrite = await upload(replacement)
    expect(overwrite.status).toBe(412)

    const stored = await getAWSClient().getObject({
      Bucket: getTestBucketName(),
      Key: 'protected.png',
    })
    expect(Buffer.from(await stored.Body!.transformToByteArray())).toEqual(file)
  })

  it("should reject signed URL generation by access control when 'x-disallow-access' header is set", async () => {
    const response = await restClient.POST(signedURLEndpoint, {
      body: signedURLBody('media', 'image.png', MB(1), 'image/png'),
      headers: {
        'x-disallow-access': 'true',
      },
    })

    expect(response.status).toBe(403)
  })

  it('should generate signed URL for file within size limit', async () => {
    const response = await restClient.POST(signedURLEndpoint, {
      body: signedURLBody('media', 'small-file.png', 500_000, 'image/png'),
    })

    expect(response.status).toBe(200)
    const { url } = await response.json()
    expect(url).toBeDefined()
    expect(url).toContain(getTestBucketName())
    expect(url).toContain('small-file.png')
  })

  it('should reject file exceeding size limit', async () => {
    const response = await restClient.POST(signedURLEndpoint, {
      body: signedURLBody('media', 'large-file.png', MB(11), 'image/png'),
    })

    expect(response.status).toBe(400)
    const { errors } = await response.json()
    expect(errors).toBeDefined()
    expect(errors[0].message).toContain('Exceeded file size limit')
    expect(errors[0].message).toMatch(/Limit: 10\.0\dMB/)
    expect(errors[0].message).toMatch(/got: 11\.0\dMB/)
  })

  it('should enforce the configured file size limit', async () => {
    const response = await restClient.POST(signedURLEndpoint, {
      body: signedURLBody('media', 'boundary-file.png', MB(10) + 1, 'image/png'),
    })

    expect(response.status).toBe(400)
    const { errors } = await response.json()
    expect(errors).toBeDefined()
    expect(errors[0].message).toContain('Exceeded file size limit')
  })

  it('should accept file exactly at limit', async () => {
    const response = await restClient.POST(signedURLEndpoint, {
      body: signedURLBody('media', 'exact-limit.png', MB(10), 'image/png'),
    })

    expect(response.status).toBe(200)
    const { url } = await response.json()
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
      body: file,
      headers: {
        'Content-Type': mimeType,
        'If-None-Match': '*',
      },
      method: 'PUT',
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
