import type { Payload } from 'payload'

import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import type { NextRESTClient } from '../__helpers/shared/NextRESTClient.js'

import { initPayloadInt } from '../__helpers/shared/initPayloadInt.js'
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

let payload: Payload
let restClient: NextRESTClient

describe('@payloadcms/storage-vercel-blob', () => {
  beforeAll(async () => {
    ;({ payload, restClient } = await initPayloadInt(dirname))

    await clearTestBlobs()
  })

  afterAll(async () => {
    await payload.destroy()
  })

  afterEach(async () => {
    await clearTestBlobs()
    await Promise.all([
      payload.delete({ collection: mediaSlug, where: {} }),
      payload.delete({ collection: mediaWithPrefixSlug, where: {} }),
      payload.delete({ collection: mediaWithAlwaysInsertFieldsSlug, where: {} }),
      payload.delete({ collection: mediaWithDirectAccessSlug, where: {} }),
      payload.delete({ collection: mediaWithDynamicPrefixSlug, where: {} }),
    ])
  })

  it('can upload', async () => {
    const upload = await payload.create({
      collection: mediaSlug,
      data: {},
      filePath: path.resolve(dirname, '../uploads/image.png'),
    })

    expect(upload.id).toBeTruthy()

    await verifyUploads({
      collectionSlug: mediaSlug,
      payload,
      uploadId: upload.id,
    })

    expect(upload.url).toEqual(`/api/${mediaSlug}/file/${String(upload.filename)}`)
  })

  it('can upload with prefix', async () => {
    const upload = await payload.create({
      collection: mediaWithPrefixSlug,
      data: {},
      filePath: path.resolve(dirname, '../uploads/image.png'),
    })

    expect(upload.id).toBeTruthy()

    await verifyUploads({
      collectionSlug: mediaWithPrefixSlug,
      payload,
      prefix,
      uploadId: upload.id,
    })

    expect(upload.url).toEqual(
      `/api/${mediaWithPrefixSlug}/file/${String(upload.filename)}?prefix=${encodeURIComponent(prefix)}`,
    )
  })

  it('has prefix field with alwaysInsertFields even when plugin is disabled', async () => {
    const upload = await payload.create({
      collection: mediaWithAlwaysInsertFieldsSlug,
      data: {
        prefix: 'test',
      },
      filePath: path.resolve(dirname, '../uploads/image.png'),
    })

    expect(upload.id).toBeTruthy()
    expect(upload.prefix).toBe('test')
  })

  it('should return 404 when the file is not found', async () => {
    const response = await restClient.GET(`/${mediaSlug}/file/missing.png`)
    expect(response.status).toBe(404)
  })

  it('should serve file through static handler with correct headers', async () => {
    await payload.create({
      collection: mediaSlug,
      data: {},
      filePath: path.resolve(dirname, '../uploads/image.png'),
    })

    const response = await restClient.GET(`/${mediaSlug}/file/image.png`)

    expect(response.status).toBe(200)
    expect(response.headers.get('Content-Type')).toBe('image/png')
    // Media collection sets this via modifyResponseHeaders
    expect(response.headers.get('X-Universal-Truth')).toBe('Set')
  })

  it('should return 304 when ETag matches', async () => {
    await payload.create({
      collection: mediaSlug,
      data: {},
      filePath: path.resolve(dirname, '../uploads/image.png'),
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

  describe('disablePayloadAccessControl', () => {
    it('should return direct blob URL when uploading', async () => {
      const upload = await payload.create({
        collection: mediaWithDirectAccessSlug,
        data: {},
        filePath: path.resolve(dirname, '../uploads/image.png'),
      })

      expect(upload.id).toBeTruthy()
      expect(upload.url).toContain(process.env.STORAGE_VERCEL_BLOB_BASE_URL)
      expect(upload.url).toContain('image.png')
      expect(upload.url).not.toMatch(/^\/api\//)

      const response = await fetch(upload.url)
      expect(response.status).toBe(200)
      expect(response.headers.get('Content-Type')).toBe('image/png')
    })

    it('should store full blob URLs for image sizes in database', async () => {
      const upload = await payload.create({
        collection: mediaWithDirectAccessSlug,
        data: {},
        filePath: path.resolve(dirname, '../uploads/image.png'),
      })

      expect(upload.sizes?.thumbnail?.url).toContain(process.env.STORAGE_VERCEL_BLOB_BASE_URL)
      expect(upload.sizes?.thumbnail?.url).not.toMatch(/^\/api\//)

      const dbDoc = await payload.db.findOne({
        collection: mediaWithDirectAccessSlug,
        where: { id: { equals: upload.id } },
      })

      expect(dbDoc?.sizes?.thumbnail?.url).toContain(process.env.STORAGE_VERCEL_BLOB_BASE_URL)
      expect(dbDoc?.sizes?.thumbnail?.url).not.toMatch(/^\/api\//)
    })

    it('should return direct blob URL with encoded filename for file with spaces', async () => {
      const upload = await payload.create({
        collection: mediaWithDirectAccessSlug,
        data: {},
        filePath: path.resolve(dirname, '../uploads/image with spaces.png'),
      })

      expect(upload.id).toBeTruthy()
      expect(upload.filename).toBe('image with spaces.png')
      expect(upload.url).toContain(process.env.STORAGE_VERCEL_BLOB_BASE_URL)
      expect(upload.url).toContain('image%20with%20spaces.png')

      const response = await fetch(upload.url)
      expect(response.status).toBe(200)
    })
  })

  describe('prefix collision detection', () => {
    beforeEach(async () => {
      await clearTestBlobs()
      await payload.delete({ collection: mediaWithPrefixSlug, where: {} })
      await payload.delete({ collection: mediaSlug, where: {} })
      await payload.delete({ collection: mediaWithAlwaysInsertFieldsSlug, where: {} })
    })

    it('detects collision within same prefix', async () => {
      const imageFile = path.resolve(dirname, '../uploads/image.png')

      const upload1 = await payload.create({
        collection: mediaWithPrefixSlug,
        data: {},
        filePath: imageFile,
      })

      const upload2 = await payload.create({
        collection: mediaWithPrefixSlug,
        data: {},
        filePath: imageFile,
      })

      expect(upload1.filename).toBe('image.png')
      expect(upload2.filename).toBe('image-1.png')
      expect(upload1.prefix).toBe(prefix)
      expect(upload2.prefix).toBe(prefix)
    })

    it('works normally for collections without prefix', async () => {
      const imageFile = path.resolve(dirname, '../uploads/image.png')

      const upload1 = await payload.create({
        collection: mediaSlug,
        data: {},
        filePath: imageFile,
      })

      const upload2 = await payload.create({
        collection: mediaSlug,
        data: {},
        filePath: imageFile,
      })

      expect(upload1.filename).toBe('image.png')
      expect(upload2.filename).toBe('image-1.png')
      // @ts-expect-error prefix should never be set
      expect(upload1.prefix).toBeUndefined()
      // @ts-expect-error prefix should never be set
      expect(upload2.prefix).toBeUndefined()
    })

    it('allows same filename under different prefixes', async () => {
      const imageFile = path.resolve(dirname, '../uploads/image.png')

      const upload1 = await payload.create({
        collection: mediaWithPrefixSlug,
        data: {},
        filePath: imageFile,
      })

      const upload2 = await payload.create({
        collection: mediaWithPrefixSlug,
        data: { prefix: 'different-prefix' },
        filePath: imageFile,
      })

      expect(upload1.filename).toBe('image.png')
      expect(upload2.filename).toBe('image.png')
      expect(upload1.prefix).toBe(prefix)
      expect(upload2.prefix).toBe('different-prefix')
    })

    it('supports multi-tenant scenario with dynamic prefix from hook', async () => {
      const imageFile = path.resolve(dirname, '../uploads/image.png')

      const tenantAUpload = await payload.create({
        collection: mediaWithDynamicPrefixSlug,
        data: { tenant: 'a' },
        filePath: imageFile,
      })

      const tenantBUpload = await payload.create({
        collection: mediaWithDynamicPrefixSlug,
        data: { tenant: 'b' },
        filePath: imageFile,
      })

      expect(tenantAUpload.filename).toBe('image.png')
      expect(tenantBUpload.filename).toBe('image.png')
      expect(tenantAUpload.prefix).toBe('tenant-a')
      expect(tenantBUpload.prefix).toBe('tenant-b')
    })
  })
})
