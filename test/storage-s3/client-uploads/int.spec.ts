/* eslint vitest/no-standalone-expect: ["error", { "additionalTestBlockFunctions": ["test", "test.options", "test.for", "test.each"] }] -- Tests use the shared fixture wrapper. */
import type { UploadInstructions } from 'payload'

import { readFileSync } from 'fs'
import path from 'path'
import { assert } from 'ts-essentials'
import { fileURLToPath } from 'url'
import { expect } from 'vitest'

import { getStoredUploadKeys } from '../../__helpers/int/storedUploadKeys.js'
import { test } from '../../__helpers/int/vitest.js'
import { mediaHeaderOnlySlug, mediaHeaderOnlyWithSizesSlug, mediaSlug } from '../shared.js'
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

test.suite('@payloadcms/storage-s3 clientUploads', { config: './config.ts' }, () => {
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
      filename: 'image.png',
      mimeType: 'image/png',
      size: file.length,
      uploadReference: {
        _objectKey: expect.stringMatching(/^[0-9a-f-]+$/),
        prefix: '',
        signedReceipt: expect.any(String),
      },
    })

    if (instructions.type !== 'http') {
      throw new Error('Expected HTTP upload instructions')
    }

    expect(instructions.request.method).toBe('PUT')
    expect(instructions.request.headers).toEqual({
      'Content-Length': String(file.length),
      'Content-Type': 'image/png',
      'If-None-Match': '*',
    })
    const { url } = instructions.request

    expect(url).toBeDefined()
    expect(new URL(url).searchParams.get('X-Amz-SignedHeaders')?.split(';')).toEqual(
      expect.arrayContaining(['content-length', 'content-type']),
    )

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
        Key: decodeURIComponent(new URL(url).pathname.split('/').slice(2).join('/')),
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

  test('should return the new image URL immediately after cropping a client upload', async ({
    payload,
    restClient,
  }) => {
    await restClient.login({ slug: 'users' })

    const file = readFileSync(path.resolve(dirname, '../../uploads/image.png'))
    const instructions = await restClient
      .POST(signedURLEndpoint, {
        body: signedURLBody(mediaSlug, 'image.png', file.length, 'image/png'),
      })
      .then((res) => res.json<UploadInstructions>())

    if (instructions.type !== 'http') {
      throw new Error('Expected HTTP upload instructions')
    }

    const upload = await fetch(instructions.request.url, {
      body: file,
      headers: { 'Content-Type': 'image/png' },
      method: 'PUT',
    })
    expect(upload.ok).toBe(true)

    const formData = new FormData()
    formData.append('file', JSON.stringify(instructions.file))
    const createResponse = await restClient.POST(`/${mediaSlug}`, { body: formData })
    expect(createResponse.status).toBe(201)
    const { doc: created } = await createResponse.json<{ doc: { id: string; url: string } }>()

    const cropResponse = await restClient.PATCH(`/${mediaSlug}/${created.id}`, {
      body: JSON.stringify({ _transforms: { crop: { height: 800, width: 800, x: 0, y: 0 } } }),
    })
    expect(cropResponse.status).toBe(200)
    const { doc: cropped } = await cropResponse.json<{ doc: { id: string; url: string } }>()
    const reloaded = await payload.findByID({
      id: created.id,
      collection: mediaSlug,
      overrideAccess: true,
    })

    expect(cropped.url).not.toBe(created.url)
    expect(cropped.url).toBe(reloaded.url)
  })

  test('does not overwrite an existing object through client uploads', async ({ restClient }) => {
    const file = readFileSync(path.resolve(dirname, '../../uploads/image.png'))
    const replacement = Buffer.alloc(file.length, 1)
    const instructions = await restClient
      .POST(signedURLEndpoint, {
        body: signedURLBody('media', 'protected.png', file.length, 'image/png'),
      })
      .then((res) => res.json<UploadInstructions>())

    if (instructions.type !== 'http') {
      throw new Error('Expected HTTP upload instructions')
    }

    const headers = new Headers(instructions.request.headers)
    headers.delete('Content-Length')

    const upload = (body: Buffer) =>
      fetch(instructions.request.url, {
        body,
        headers,
        method: instructions.request.method,
      })

    await expect(upload(file)).resolves.toMatchObject({ ok: true })

    const overwrite = await upload(replacement)
    expect(overwrite.status).toBe(412)

    const stored = await getAWSClient().getObject({
      Bucket: getTestBucketName(),
      Key: decodeURIComponent(
        new URL(instructions.request.url).pathname.split('/').slice(2).join('/'),
      ),
    })
    expect(Buffer.from(await stored.Body!.transformToByteArray())).toEqual(file)
  })

  test('should reject a provider object shorter than its declared upload size', async ({
    payload,
    restClient,
  }) => {
    const instructions = await restClient
      .POST(signedURLEndpoint, {
        body: signedURLBody(mediaSlug, 'incomplete.txt', 100, 'text/plain'),
      })
      .then((response) => response.json<UploadInstructions>())

    if (instructions.type !== 'http') {
      throw new Error('Expected HTTP upload instructions')
    }

    const key = decodeURIComponent(
      new URL(instructions.request.url).pathname.split('/').slice(2).join('/'),
    )
    await getAWSClient().putObject({
      Body: Buffer.from('incomplete'),
      Bucket: getTestBucketName(),
      ContentType: 'text/plain',
      Key: key,
    })

    const formData = new FormData()
    formData.append('file', JSON.stringify(instructions.file))
    const response = await restClient.POST(`/${mediaSlug}`, { body: formData })

    expect(response.status).toBe(400)
    const docs = await payload.find({ collection: mediaSlug, overrideAccess: true })
    expect(docs.totalDocs).toBe(0)
  })

  for (const [uploadFilename, mimeType] of [
    ['reference.svg', 'image/svg+xml'],
    ['reference.xml', 'application/xml'],
    ['reference.bin', 'application/atom+xml'],
  ] as const) {
    test(`should keep ${uploadFilename} with ${mimeType} in document uploads`, async ({
      restClient,
    }) => {
      const response = await restClient.POST(signedURLEndpoint, {
        body: signedURLBody('media', uploadFilename, 100, mimeType),
      })

      expect(response.status).toBe(400)
      const { errors } = await response.json()
      expect(errors[0].message).toContain('uploaded with the document through Payload')
    })
  }

  test('should persist adapter-backed SVG only after document validation', async ({
    payload,
    restClient,
  }) => {
    const safeSVG =
      '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><rect width="10" height="10"/></svg>'
    const safeForm = new FormData()
    safeForm.append('_payload', JSON.stringify({ alt: 'Reference graphic' }))
    safeForm.append('file', new Blob([safeSVG], { type: 'image/svg+xml' }), 'reference.svg')

    const safeResponse = await restClient.POST('/media', { body: safeForm })
    const { doc } = await safeResponse.json()

    expect(safeResponse.status).toBe(201)
    expect(doc.filename).toBe('reference-original.svg')
    const stored = await payload.db.findOne({
      collection: 'media',
      where: { id: { equals: doc.id } },
    })
    const currentKey = getStoredUploadKeys({ collectionSlug: 'media', doc: stored, payload }).find(
      (key) => key.endsWith(`/${doc.filename}`),
    )

    expect(currentKey).toBeTruthy()
    await expect(
      getAWSClient().headObject({ Bucket: getTestBucketName(), Key: currentKey! }),
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
          '<?xml version="1.0"?><svg xmlns="http://www.w3.org/2000/svg" onload="reference()"><rect width="10" height="10"/></svg>',
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

  test('should reject upload instructions without collection create or update permission', async ({
    restClient,
  }) => {
    const response = await restClient.POST(signedURLEndpoint, {
      body: signedURLBody(mediaSlug, 'forbidden.png', MB(1), 'image/png'),
      headers: {
        'x-disallow-create': 'true',
        'x-disallow-update': 'true',
      },
    })
    const body = await response.json()

    expect(response.status).toBe(403)
    expect(body.request).toBeUndefined()
    expect(body.errors).toBeDefined()
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
    expect(url).toContain('small-file-original.png')
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
      expect(url).toContain('photo-original.png')
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
      expect(url).toContain('document-original.png')
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
      expect(url).toContain('photo-original.png')
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
      expect(url).toContain('safe-image-original.png')
    })

    // Regression for #16694: trailing dots are stripped from the storage key the same way they
    // are stripped from the DB filename, so the key and doc.filename stay in sync.
    test('should strip trailing dots so the storage key matches the DB filename', async ({
      restClient,
    }) => {
      const file = readFileSync(path.resolve(dirname, '../../uploads/image.png'))

      const {
        request: { url },
      } = await restClient
        .POST(signedURLEndpoint, {
          body: signedURLBody('media-with-prefix', 'report...png', file.length, 'image/png'),
        })
        .then((res) => res.json<{ request: { url: string } }>())

      expect(url).toBeDefined()
      expect(url).toContain('test-prefix')
      expect(url).toContain('report-original.png')
      expect(url).not.toContain('report...png')
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
        await payload.delete({ id, collection: mediaHeaderOnlySlug, overrideAccess: true })
      }
      createdIds.length = 0
    })

    test('creates a versioned document with a retained provider original', async ({
      payload,
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
      expect(doc.original.filename).toBe('header-only-original.png')
      expect(doc.filename).toBe(doc.original.filename)

      const stored = await payload.findByID({
        id: doc.id,
        collection: mediaHeaderOnlySlug,
        overrideAccess: true,
        showHiddenFields: true,
      })
      expect(
        getStoredUploadKeys({ collectionSlug: mediaHeaderOnlySlug, doc: stored, payload }),
      ).toEqual([
        decodeURIComponent(
          new URL(instructions.request.url).pathname.split('/').slice(2).join('/'),
        ),
      ])
      const originalResponse = await restClient.GET(
        `/${mediaHeaderOnlySlug}/file/${doc.original.filename}`,
      )
      expect(originalResponse.status).toBe(200)
      expect(Buffer.from(await originalResponse.arrayBuffer())).toEqual(file)
    })

    test('does not create a document when the provider upload never completes', async ({
      payload,
      restClient,
    }) => {
      const instructions = await restClient
        .POST(signedURLEndpoint, {
          body: signedURLBody(mediaHeaderOnlySlug, 'missing.png', 100, 'image/png'),
        })
        .then((res) => res.json<UploadInstructions>())

      const formData = new FormData()
      formData.append('file', JSON.stringify(instructions.file))
      const response = await restClient.POST(`/${mediaHeaderOnlySlug}`, { body: formData })

      expect(response.status).toBeGreaterThanOrEqual(400)
      const docs = await payload.find({ collection: mediaHeaderOnlySlug, overrideAccess: true })
      expect(docs.totalDocs).toBe(0)
    })
  })

  /**
   * `media-header-only-with-sizes` has `variants` configured but no `resizeOptions`, so a
   * client upload larger than `HEADER_PROBE_BYTE_LENGTH` (1MB) is a regression test for a bug
   * where `getFileContentRequirement` ignored `variants` and chose the `'header'` content
   * requirement anyway - handing `createImageSizes` a truncated buffer and crashing instead of
   * fetching the full file through the real S3 handler.
   */
  test.describe('variants with a large upload (real S3 handler)', () => {
    const createdIds: (number | string)[] = []

    test.afterEach(async ({ payload }) => {
      for (const id of createdIds) {
        await payload.delete({ id, collection: mediaHeaderOnlyWithSizesSlug, overrideAccess: true })
      }
      createdIds.length = 0
    })

    test('retains the direct original while generating a stored image size', async ({
      payload,
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
      expect(doc.variants.thumbnail.width).toBe(400)
      expect(doc.variants.thumbnail.height).toBe(300)
      expect(doc.variants.thumbnail.filename).toBeTruthy()
      const stored = await payload.findByID({
        id: doc.id,
        collection: mediaHeaderOnlyWithSizesSlug,
        overrideAccess: true,
        showHiddenFields: true,
      })
      expect(
        getStoredUploadKeys({ collectionSlug: mediaHeaderOnlyWithSizesSlug, doc: stored, payload }),
      ).toHaveLength(2)
    }, 60000)
  })

  test.afterEach(async () => {
    await clearTestBucket()
  })
  test('should keep a legacy original readable through repeated image edits', async ({
    payload,
    restClient,
  }) => {
    await restClient.login({ slug: 'users' })
    const bytes = readFileSync(path.resolve(dirname, '../../uploads/image.png'))
    const filename = 'legacy-source.png'
    await getAWSClient().putObject({
      Body: bytes,
      Bucket: getTestBucketName(),
      ContentType: 'image/png',
      Key: filename,
    })
    const created = await payload.db.create({
      collection: mediaSlug,
      data: {
        filename,
        filesize: bytes.length,
        height: 800,
        mimeType: 'image/png',
        url: `/api/${mediaSlug}/file/${filename}`,
        width: 800,
      },
    })

    for (const x of [0, 25]) {
      const response = await restClient.PATCH(`/${mediaSlug}/${created.id}`, {
        body: JSON.stringify({
          _transforms: { crop: { height: 400, width: 400, x: (800 * x) / 100, y: 0 } },
        }),
        query: {
          uploadEdits: {
            crop: { height: 50, unit: '%', width: 50, x, y: 0 },
            heightInPixels: 800,
            widthInPixels: 800,
          },
        },
      })

      expect(response.status).toBe(200)
      const { doc } = await response.json<{ doc: { original: { url: string }; url: string } }>()
      expect(doc.url).not.toBe(doc.original.url)
      const source = new URL(doc.original.url, 'http://localhost')
      const original = await restClient.GET(
        `${source.pathname.replace(/^\/api/, '')}${source.search}`,
      )
      expect(original.status).toBe(200)
      expect(Buffer.from(await original.arrayBuffer())).toEqual(bytes)
    }
  })
  test('should clean a legacy variant from its inherited folder after its last version is pruned', async ({
    payload,
    restClient,
  }) => {
    await restClient.login({ slug: 'users' })
    const bytes = readFileSync(path.resolve(dirname, '../../uploads/image.png'))
    const filename = 'legacy-source.png'
    const variantFilename = 'legacy-thumbnail.png'
    const prefix = 'legacy-folder'
    const client = getAWSClient()
    const Bucket = getTestBucketName()
    await client.putObject({
      Body: bytes,
      Bucket,
      ContentType: 'image/png',
      Key: `${prefix}/${filename}`,
    })
    await client.putObject({
      Body: bytes,
      Bucket,
      ContentType: 'image/png',
      Key: `${prefix}/${variantFilename}`,
    })
    const created = await payload.db.create({
      collection: mediaHeaderOnlyWithSizesSlug,
      data: {
        filename,
        filesize: bytes.length,
        height: 1600,
        mimeType: 'image/png',
        prefix,
        url: `/api/${mediaHeaderOnlyWithSizesSlug}/file/${filename}`,
        variants: {
          thumbnail: {
            filename: variantFilename,
            filesize: bytes.length,
            height: 1600,
            mimeType: 'image/png',
            url: `/api/${mediaHeaderOnlyWithSizesSlug}/file/${variantFilename}`,
            width: 1600,
          },
        },
        width: 1600,
      },
    })

    const collection = payload.collections[mediaHeaderOnlyWithSizesSlug].config
    const previousVersions = collection.versions
    collection.versions = { ...previousVersions, maxPerDoc: 1 }

    try {
      const response = await restClient.PATCH(`/${mediaHeaderOnlyWithSizesSlug}/${created.id}`, {
        body: JSON.stringify({
          _transforms: { crop: { height: 800, width: 800, x: 0, y: 0 } },
        }),
        query: {
          uploadEdits: {
            crop: { height: 50, unit: '%', width: 50, x: 0, y: 0 },
            heightInPixels: 1600,
            widthInPixels: 1600,
          },
        },
      })

      expect(response.status).toBe(200)
      const objects = await client.listObjectsV2({ Bucket })
      expect(objects.Contents?.some(({ Key }) => Key === `${prefix}/${variantFilename}`)).toBe(
        false,
      )
      expect(objects.Contents?.some(({ Key }) => Key === `${prefix}/${filename}`)).toBe(true)
    } finally {
      collection.versions = previousVersions
    }
  })
})
