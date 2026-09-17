import type { UploadInstructions } from 'payload'

import { readFileSync } from 'fs'
import path from 'path'
import { assert } from 'ts-essentials'
import { fileURLToPath } from 'url'
import { expect } from 'vitest'

import { test } from '../../__helpers/int/vitest.js'
import { mediaHeaderOnlySlug, mediaHeaderOnlyWithSizesSlug } from '../shared.js'
import {
  clearTestBucket,
  createTestBucket,
  getAWSClient,
  getTestBucketName,
  MB,
} from '../test-utils.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const signedURLEndpoint = '/upload-instructions'

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

test.suite({ config: './config.ts' })('@payloadcms/storage-s3 clientUploads', () => {
  test.beforeEach(async () => {
    await createTestBucket()
    await clearTestBucket()
  })

  test('should generate a signed upload URL', async ({ restClient }) => {
    const file = readFileSync(path.resolve(dirname, '../../uploads/image.png'))

    const instructions = await restClient
      .POST(signedURLEndpoint, {
        body: signedURLBody('media', 'image.png', file.length, 'image/png'),
      })
      .then((res) => res.json<UploadInstructions>())

    expect(instructions.type).toBe('http')
    expect(instructions.file).toEqual({
      uploadReference: { prefix: '' },
      filename: 'image.png',
      mimeType: 'image/png',
      size: file.length,
    })

    if (instructions.type !== 'http') {
      throw new Error('Expected HTTP upload instructions')
    }

    expect(instructions.request.method).toBe('PUT')
    expect(instructions.request.headers).toEqual({
      'Content-Length': String(file.length),
      'Content-Type': 'image/png',
    })
    const { url } = instructions.request

    expect(url).toBeDefined()

    const uploadResponse = await fetch(url, {
      body: file,
      headers: {
        'Content-Type': 'image/png',
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

  test("should reject signed URL generation by access control when 'x-disallow-access' header is set", async ({
    restClient,
  }) => {
    const response = await restClient.POST(signedURLEndpoint, {
      body: signedURLBody('media', 'image.png', MB(1), 'image/png'),
      headers: {
        'x-disallow-access': 'true',
      },
    })

    expect(response.status).toBe(403)
  })

  test('should generate signed URL for file within size limit', async ({ restClient }) => {
    const response = await restClient.POST(signedURLEndpoint, {
      body: signedURLBody('media', 'small-file.png', 500_000, 'image/png'),
    })

    expect(response.status).toBe(200)
    const {
      request: { url },
    } = await response.json()
    expect(url).toBeDefined()
    expect(url).toContain(getTestBucketName())
    expect(url).toContain('small-file.png')
  })

  test('should reject file exceeding size limit', async ({ restClient }) => {
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

  test('should reject file exactly at limit boundary', async ({ restClient }) => {
    const response = await restClient.POST(signedURLEndpoint, {
      body: signedURLBody('media', 'boundary-file.png', MB(10.1), 'image/png'),
    })

    expect(response.status).toBe(400)
    const { errors } = await response.json()
    expect(errors).toBeDefined()
    expect(errors[0].message).toContain('Exceeded file size limit')
  })

  test('should accept file exactly at limit', async ({ restClient }) => {
    const response = await restClient.POST(signedURLEndpoint, {
      body: signedURLBody('media', 'exact-limit.png', MB(10), 'image/png'),
    })

    expect(response.status).toBe(200)
    const {
      request: { url },
    } = await response.json()
    expect(url).toBeDefined()
  })

  test('should not allow bypassing with passing a smaller file size but uploading a larger file', async ({
    restClient,
  }) => {
    const declaredFilesize = MB(5)
    const actualFilesize = MB(15)
    const mimeType = 'text/plain'

    const buffer = Buffer.alloc(actualFilesize, 0)
    const file = new Blob([buffer], { type: mimeType })

    const {
      request: { url },
    } = await restClient
      .POST(signedURLEndpoint, {
        body: signedURLBody('media', 'bypass-file.png', declaredFilesize, mimeType),
      })
      .then((res) => res.json<{ request: { url: string } }>())

    expect(url).toBeDefined()

    const uploadResponse = await fetch(url, {
      body: file,
      headers: {
        'Content-Type': mimeType,
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

  test.describe('filename handling', () => {
    test('should sanitize special characters in filename', async ({ restClient }) => {
      const file = readFileSync(path.resolve(dirname, '../../uploads/image.png'))

      const {
        request: { url },
      } = await restClient
        .POST(signedURLEndpoint, {
          body: signedURLBody('media-with-prefix', '../photo.png', file.length, 'image/png'),
        })
        .then((res) => res.json<{ request: { url: string } }>())

      expect(url).toBeDefined()
      expect(url).toContain('test-prefix')
      expect(url).toContain('photo.png')
      expect(url).not.toContain('..')
    })

    test('should sanitize deeply nested special characters in filename', async ({ restClient }) => {
      const file = readFileSync(path.resolve(dirname, '../../uploads/image.png'))

      const {
        request: { url },
      } = await restClient
        .POST(signedURLEndpoint, {
          body: signedURLBody(
            'media-with-prefix',
            '../../other-prefix/document.png',
            file.length,
            'image/png',
          ),
        })
        .then((res) => res.json<{ request: { url: string } }>())

      expect(url).toBeDefined()
      expect(url).toContain('test-prefix')
      expect(url).toContain('document.png')
      expect(url).not.toContain('..')
      expect(url).not.toContain('other-prefix')
    })

    test('should sanitize backslash characters in filename', async ({ restClient }) => {
      const file = readFileSync(path.resolve(dirname, '../../uploads/image.png'))

      const {
        request: { url },
      } = await restClient
        .POST(signedURLEndpoint, {
          body: signedURLBody('media-with-prefix', '..\\..\\photo.png', file.length, 'image/png'),
        })
        .then((res) => res.json<{ request: { url: string } }>())

      expect(url).toBeDefined()
      expect(url).toContain('test-prefix')
      expect(url).toContain('photo.png')
      expect(url).not.toContain('..')
    })

    test('should allow normal filenames with prefix', async ({ restClient }) => {
      const file = readFileSync(path.resolve(dirname, '../../uploads/image.png'))

      const {
        request: { url },
      } = await restClient
        .POST(signedURLEndpoint, {
          body: signedURLBody('media-with-prefix', 'safe-image.png', file.length, 'image/png'),
        })
        .then((res) => res.json<{ request: { url: string } }>())

      expect(url).toBeDefined()
      expect(url).toContain('test-prefix')
      expect(url).toContain('safe-image.png')
    })
  })

  /**
   * `media-header-only` has no resizeOptions/mimeTypes configured, so a plain image upload
   * takes the `'header'` content-requirement path: the server only fetches a byte-range probe
   * from the real S3 handler instead of the whole file. This is a regression test for a bug
   * where that path crashed against the real adapter (it reads `req.signal`, which threw when
   * the server cloned the request via `Object.create` to add the range header) - completing the
   * full round trip end to end is the only way to exercise the real handler for this path, since
   * unit tests mock the handler and never see that crash.
   */
  test.describe('header-only content requirement (real S3 handler)', () => {
    const createdIds: (number | string)[] = []

    test.afterEach(async ({ payload }) => {
      for (const id of createdIds) {
        await payload.delete({ id, collection: mediaHeaderOnlySlug })
      }
      createdIds.length = 0
    })

    test('creates a document from a client-uploaded image via the real S3 handler', async ({
      restClient,
    }) => {
      const file = readFileSync(path.resolve(dirname, '../../uploads/image.png'))

      const instructions = await restClient
        .POST(signedURLEndpoint, {
          body: signedURLBody(mediaHeaderOnlySlug, 'header-only.png', file.length, 'image/png'),
        })
        .then((res) => res.json<UploadInstructions>())

      if (instructions.type !== 'http') {
        throw new Error('Expected HTTP upload instructions')
      }

      const uploadResponse = await fetch(instructions.request.url, {
        body: file,
        headers: { 'Content-Type': 'image/png' },
        method: 'PUT',
      })
      expect(uploadResponse.ok).toBe(true)

      const createFormData = new FormData()
      createFormData.append('file', JSON.stringify(instructions.file))

      const createRes = await restClient.POST(`/${mediaHeaderOnlySlug}`, {
        body: createFormData,
      })

      expect(createRes.status).toBe(201)
      const { doc } = await createRes.json()
      createdIds.push(doc.id)

      expect(doc.width).toBe(1600)
      expect(doc.height).toBe(1600)
      expect(doc.filesize).toBe(file.length)
      expect(doc.mimeType).toBe('image/png')
    })
  })

  /**
   * `media-header-only-with-sizes` has `imageSizes` configured but no `resizeOptions`, so a
   * client upload larger than `HEADER_PROBE_BYTE_LENGTH` (1MB) is a regression test for a bug
   * where `getFileContentRequirement` ignored `imageSizes` and chose the `'header'` content
   * requirement anyway - handing `createImageSizes` a truncated buffer and crashing instead of
   * fetching the full file through the real S3 handler.
   */
  test.describe('imageSizes with a large upload (real S3 handler)', () => {
    const createdIds: (number | string)[] = []

    test.afterEach(async ({ payload }) => {
      for (const id of createdIds) {
        await payload.delete({ id, collection: mediaHeaderOnlyWithSizesSlug })
      }
      createdIds.length = 0
    })

    test('creates a document and generates image sizes from a large client-uploaded image via the real S3 handler', async ({
      restClient,
    }) => {
      const file = readFileSync(path.resolve(dirname, '../../uploads/2mb.jpg'))
      expect(file.length).toBeGreaterThan(1024 * 1024)

      const instructions = await restClient
        .POST(signedURLEndpoint, {
          body: signedURLBody(
            mediaHeaderOnlyWithSizesSlug,
            'large-with-sizes.jpg',
            file.length,
            'image/jpeg',
          ),
        })
        .then((res) => res.json<UploadInstructions>())

      if (instructions.type !== 'http') {
        throw new Error('Expected HTTP upload instructions')
      }

      const uploadResponse = await fetch(instructions.request.url, {
        body: file,
        headers: { 'Content-Type': 'image/jpeg' },
        method: 'PUT',
      })
      expect(uploadResponse.ok).toBe(true)

      const createFormData = new FormData()
      createFormData.append('file', JSON.stringify(instructions.file))

      const createRes = await restClient.POST(`/${mediaHeaderOnlyWithSizesSlug}`, {
        body: createFormData,
      })

      expect(createRes.status).toBe(201)
      const { doc } = await createRes.json()
      createdIds.push(doc.id)

      expect(doc.filesize).toBe(file.length)
      expect(doc.mimeType).toBe('image/jpeg')
      expect(doc.sizes.thumbnail.width).toBe(400)
      expect(doc.sizes.thumbnail.height).toBe(300)
      expect(doc.sizes.thumbnail.filename).toBeTruthy()
    }, 60000)
  })

  test.afterEach(async () => {
    await clearTestBucket()
  })
})
