/* eslint vitest/no-standalone-expect: ["error", { "additionalTestBlockFunctions": ["test"] }] -- Tests use the shared fixture wrapper. */
import { head, put } from '@vercel/blob'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import { expect } from 'vitest'

import { copyVercelBlobFile } from '../../packages/storage-vercel-blob/src/copyFile.js'
import { test } from '../__helpers/int/vitest.js'
import { runTransformReadsRealSourceTest } from '../__helpers/shared/transformSourceTests.js'
import {
  mediaSlug,
  mediaWithAlwaysInsertFieldsSlug,
  mediaWithDirectAccessSlug,
  mediaWithDynamicPrefixSlug,
  mediaWithPrefixSlug,
  prefix,
} from './shared.js'
import { clearTestBlobs, verifyUploads } from './test-utils.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

dotenv.config({ path: path.resolve(dirname, '../plugin-cloud-storage/.env.emulated') })

test.suite('@payloadcms/storage-vercel-blob', { config: './config.ts' }, () => {
  test.beforeEach(async () => {
    await clearTestBlobs()
  })

  test.afterEach(async ({ payload }) => {
    await clearTestBlobs()
    await Promise.all([
      payload.delete({ collection: mediaSlug, overrideAccess: true, where: {} }),
      payload.delete({ collection: mediaWithPrefixSlug, overrideAccess: true, where: {} }),
      payload.delete({
        collection: mediaWithAlwaysInsertFieldsSlug,
        overrideAccess: true,
        where: {},
      }),
      payload.delete({ collection: mediaWithDirectAccessSlug, overrideAccess: true, where: {} }),
      payload.delete({ collection: mediaWithDynamicPrefixSlug, overrideAccess: true, where: {} }),
    ])
  })

  test('should copy a blob to an exact unused pathname and preserve content type', async () => {
    const token = process.env.BLOB_READ_WRITE_TOKEN!
    await put('copy-source.txt', Buffer.from('copy source'), {
      access: 'public',
      addRandomSuffix: false,
      contentType: 'text/plain',
      token,
    })

    await copyVercelBlobFile({
      access: 'public',
      cacheControlMaxAge: 60,
      from: 'copy-source.txt',
      to: 'copy-destination.txt',
      token,
    })

    expect((await head('copy-destination.txt', { token })).contentType).toBe('text/plain')
    expect((await head('copy-source.txt', { token })).size).toBe(11)
    await expect(
      copyVercelBlobFile({
        access: 'public',
        cacheControlMaxAge: 60,
        from: 'copy-source.txt',
        to: 'copy-destination.txt',
        token,
      }),
    ).rejects.toThrow()
  })

  test('can upload', async ({ payload }) => {
    const upload = await payload.create({
      collection: mediaSlug,
      data: {},
      filePath: path.resolve(dirname, '../uploads/image.png'),
      overrideAccess: true,
    })

    expect(upload.id).toBeTruthy()

    await verifyUploads({
      collectionSlug: mediaSlug,
      payload,
      uploadId: upload.id,
    })

    expect(upload.url).toEqual(`/api/${mediaSlug}/file/${String(upload.filename)}`)
  })

  test('can upload with prefix', async ({ payload }) => {
    const upload = await payload.create({
      collection: mediaWithPrefixSlug,
      data: {},
      filePath: path.resolve(dirname, '../uploads/image.png'),
      overrideAccess: true,
    })

    expect(upload.id).toBeTruthy()

    await verifyUploads({
      collectionSlug: mediaWithPrefixSlug,
      payload,
      prefix,
      uploadId: upload.id,
    })

    expect(upload.url).toEqual(`/api/${mediaWithPrefixSlug}/file/${String(upload.filename)}`)
  })

  test('has prefix field by default even when plugin is disabled', async ({ payload }) => {
    const upload = await payload.create({
      collection: mediaWithAlwaysInsertFieldsSlug,
      data: {
        prefix: 'test',
      },
      filePath: path.resolve(dirname, '../uploads/image.png'),
      overrideAccess: true,
    })

    expect(upload.id).toBeTruthy()
    expect(upload.prefix).toBe('test')
  })

  test('should return 404 when the file is not found', async ({ restClient }) => {
    const response = await restClient.GET(`/${mediaSlug}/file/missing.png`)
    expect(response.status).toBe(404)
  })

  test('should serve file through static handler with correct headers', async ({
    payload,
    restClient,
  }) => {
    await payload.create({
      collection: mediaSlug,
      data: {},
      filePath: path.resolve(dirname, '../uploads/image.png'),
      overrideAccess: true,
    })

    const response = await restClient.GET(`/${mediaSlug}/file/image.png`)

    expect(response.status).toBe(200)
    expect(response.headers.get('Content-Type')).toBe('image/png')
    // Media collection sets this via modifyResponseHeaders
    expect(response.headers.get('X-Universal-Truth')).toBe('Set')
  })

  test('should return 304 when ETag matches', async ({ payload, restClient }) => {
    await payload.create({
      collection: mediaSlug,
      data: {},
      filePath: path.resolve(dirname, '../uploads/image.png'),
      overrideAccess: true,
    })

    const first = await restClient.GET(`/${mediaSlug}/file/image.png`)
    expect(first.status).toBe(200)

    const etag = first.headers.get('ETag')
    expect(etag).toBeDefined()

    const second = await restClient.GET(`/${mediaSlug}/file/image.png`, {
      headers: { 'if-none-match': etag! },
    })
    expect(second.status).toBe(304)
  })

  test.describe('disablePayloadAccessControl', () => {
    test('should return direct blob URL when uploading', async ({ payload }) => {
      const upload = await payload.create({
        collection: mediaWithDirectAccessSlug,
        data: {},
        filePath: path.resolve(dirname, '../uploads/image.png'),
        overrideAccess: true,
      })

      expect(upload.id).toBeTruthy()
      expect(upload.url).toContain(process.env.STORAGE_VERCEL_BLOB_BASE_URL)
      expect(upload.url).toContain('image-original.png')
      expect(upload.url).not.toMatch(/^\/api\//)

      const response = await fetch(upload.url)
      expect(response.status).toBe(200)
      expect(response.headers.get('Content-Type')).toBe('image/png')
    })

    test('should store full blob URLs for image sizes in database', async ({ payload }) => {
      const upload = await payload.create({
        collection: mediaWithDirectAccessSlug,
        data: {},
        filePath: path.resolve(dirname, '../uploads/image.png'),
        overrideAccess: true,
      })

      expect(upload.variants?.thumbnail?.url).toContain(process.env.STORAGE_VERCEL_BLOB_BASE_URL)
      expect(upload.variants?.thumbnail?.url).not.toMatch(/^\/api\//)

      const dbDoc = await payload.db.findOne({
        collection: mediaWithDirectAccessSlug,
        where: { id: { equals: upload.id } },
      })

      expect(dbDoc?.variants?.thumbnail?.url).toContain(process.env.STORAGE_VERCEL_BLOB_BASE_URL)
      expect(dbDoc?.variants?.thumbnail?.url).not.toMatch(/^\/api\//)
    })

    test('should return direct blob URL with encoded filename for file with spaces', async ({
      payload,
    }) => {
      const upload = await payload.create({
        collection: mediaWithDirectAccessSlug,
        data: {},
        filePath: path.resolve(dirname, '../uploads/image with spaces.png'),
        overrideAccess: true,
      })

      expect(upload.id).toBeTruthy()
      expect(upload.filename).toBe('image with spaces-original.png')
      expect(upload.url).toContain(process.env.STORAGE_VERCEL_BLOB_BASE_URL)
      expect(upload.url).toContain('image%20with%20spaces-original.png')

      const response = await fetch(upload.url)
      expect(response.status).toBe(200)
    })
  })

  test.describe('prefix collision detection', () => {
    test.beforeEach(async ({ payload }) => {
      await clearTestBlobs()
      await payload.delete({ collection: mediaWithPrefixSlug, overrideAccess: true, where: {} })
      await payload.delete({ collection: mediaSlug, overrideAccess: true, where: {} })
      await payload.delete({
        collection: mediaWithAlwaysInsertFieldsSlug,
        overrideAccess: true,
        where: {},
      })
    })

    test('detects collision within same prefix', async ({ payload }) => {
      const imageFile = path.resolve(dirname, '../uploads/image.png')

      const upload1 = await payload.create({
        collection: mediaWithPrefixSlug,
        data: {},
        filePath: imageFile,
        overrideAccess: true,
      })

      const upload2 = await payload.create({
        collection: mediaWithPrefixSlug,
        data: {},
        filePath: imageFile,
        overrideAccess: true,
      })

      expect(upload1.filename).toBe('image-original.png')
      expect(upload2.filename).toBe('image-original-1.png')
      expect(upload1.prefix).toBe(prefix)
      expect(upload2.prefix).toBe(prefix)
    })

    test('works normally for collections without prefix', async ({ payload }) => {
      const imageFile = path.resolve(dirname, '../uploads/image.png')

      const upload1 = await payload.create({
        collection: mediaSlug,
        data: {},
        filePath: imageFile,
        overrideAccess: true,
      })

      const upload2 = await payload.create({
        collection: mediaSlug,
        data: {},
        filePath: imageFile,
        overrideAccess: true,
      })

      expect(upload1.filename).toBe('image.png')
      expect(upload2.filename).toBe('image-1.png')
      // The prefix field is always inserted by default, defaulting to an empty string
      // for collections that don't configure a prefix.
      expect(upload1.prefix).toBe('')
      expect(upload2.prefix).toBe('')
    })

    test('allows same filename under different prefixes', async ({ payload }) => {
      const imageFile = path.resolve(dirname, '../uploads/image.png')

      const upload1 = await payload.create({
        collection: mediaWithPrefixSlug,
        data: {},
        filePath: imageFile,
        overrideAccess: true,
      })

      const upload2 = await payload.create({
        collection: mediaWithPrefixSlug,
        data: { prefix: 'different-prefix' },
        filePath: imageFile,
        overrideAccess: true,
      })

      expect(upload1.filename).toBe('image-original.png')
      expect(upload2.filename).toBe('image-original.png')
      expect(upload1.prefix).toBe(prefix)
      // New uploads store the document prefix beneath the collection prefix.
      expect(upload2.prefix).toBe(`${prefix}/different-prefix`)
      await verifyUploads({
        collectionSlug: mediaWithPrefixSlug,
        payload,
        prefix: `${prefix}/different-prefix`,
        uploadId: upload2.id,
      })
    })

    test('supports multi-tenant scenario with dynamic prefix from hook', async ({ payload }) => {
      const imageFile = path.resolve(dirname, '../uploads/image.png')

      const tenantAUpload = await payload.create({
        collection: mediaWithDynamicPrefixSlug,
        data: { tenant: 'a' },
        filePath: imageFile,
        overrideAccess: true,
      })

      const tenantBUpload = await payload.create({
        collection: mediaWithDynamicPrefixSlug,
        data: { tenant: 'b' },
        filePath: imageFile,
        overrideAccess: true,
      })

      expect(tenantAUpload.filename).toBe('image-original.png')
      expect(tenantBUpload.filename).toBe('image-original.png')
      expect(tenantAUpload.prefix).toBe('tenant-a')
      expect(tenantBUpload.prefix).toBe('tenant-b')
    })
  })

  runTransformReadsRealSourceTest({ collection: mediaWithPrefixSlug })
})
