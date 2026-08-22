import type { CollectionConfig, PayloadRequest } from 'payload'

import { Readable } from 'stream'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@payloadcms/plugin-cloud-storage/utilities', () => ({
  getFileKey: vi.fn(() => ({ fileKey: 'logo.png' })),
  getFilePrefix: vi.fn().mockResolvedValue(''),
}))

import { ApiError } from '@google-cloud/storage'

import { getFile } from './getFile.js'

const FILE_SIZE = 1000

const makeReadStream = () => Readable.from([Buffer.from('image-bytes')])

const makeClient = (overrides: Record<string, unknown> = {}) => {
  const file = {
    createReadStream: vi.fn(makeReadStream),
    getMetadata: vi
      .fn()
      .mockResolvedValue([{ contentType: 'image/png', etag: 'etag-1', size: FILE_SIZE }]),
    ...overrides,
  }

  return {
    bucket: vi.fn(() => ({ file: vi.fn(() => file) })),
    file,
  } as never
}

const makeReq = (rangeHeader: null | string = null): PayloadRequest =>
  ({
    headers: new Headers(rangeHeader ? { range: rangeHeader } : {}),
    payload: { logger: { error: vi.fn() } },
  }) as unknown as PayloadRequest

const collection = {} as CollectionConfig

describe('storage-gcs getFile', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should honor an incoming Range header for operation "read" (regression)', async () => {
    const client = makeClient()

    const response = await getFile({
      bucket: 'test-bucket',
      client,
      collection,
      filename: 'logo.png',
      operation: 'read',
      req: makeReq('bytes=0-99'),
    })

    expect(response.status).toBe(206)
  })

  it('should ignore an incoming Range header for operation "transform"', async () => {
    const client = makeClient()

    const response = await getFile({
      bucket: 'test-bucket',
      client,
      collection,
      filename: 'logo.png',
      operation: 'transform',
      req: makeReq('bytes=0-99'),
    })

    expect(response.status).toBe(200)
    expect(response.headers.get('Content-Range')).toBeNull()
  })

  it('should not return 416 for an out-of-bounds Range header when operation is "transform"', async () => {
    const client = makeClient()

    const response = await getFile({
      bucket: 'test-bucket',
      client,
      collection,
      filename: 'logo.png',
      operation: 'transform',
      req: makeReq('bytes=999999-9999999'),
    })

    expect(response.status).toBe(200)
    expect(response.headers.get('Content-Range')).toBeNull()
  })

  it('should not call modifyResponseHeaders for operation "transform"', async () => {
    const modifyResponseHeaders = vi.fn(({ headers }) => headers)
    const client = makeClient()

    await getFile({
      bucket: 'test-bucket',
      client,
      collection: { upload: { modifyResponseHeaders } } as unknown as CollectionConfig,
      filename: 'logo.png',
      operation: 'transform',
      req: makeReq(),
    })

    expect(modifyResponseHeaders).not.toHaveBeenCalled()
  })

  it('should call modifyResponseHeaders for operation "read" (regression)', async () => {
    const modifyResponseHeaders = vi.fn(({ headers }) => headers)
    const client = makeClient()

    await getFile({
      bucket: 'test-bucket',
      client,
      collection: { upload: { modifyResponseHeaders } } as unknown as CollectionConfig,
      filename: 'logo.png',
      operation: 'read',
      req: makeReq(),
    })

    expect(modifyResponseHeaders).toHaveBeenCalledTimes(1)
  })

  it('should skip the ETag 304 short-circuit for operation "transform"', async () => {
    const client = makeClient()
    const req = makeReq()
    req.headers.set('if-none-match', 'etag-1')

    const response = await getFile({
      bucket: 'test-bucket',
      client,
      collection,
      filename: 'logo.png',
      operation: 'transform',
      req,
    })

    expect(response.status).toBe(200)
  })

  it('should honor the ETag 304 short-circuit for operation "read" (regression)', async () => {
    const client = makeClient()
    const req = makeReq()
    req.headers.set('if-none-match', 'etag-1')

    const response = await getFile({
      bucket: 'test-bucket',
      client,
      collection,
      filename: 'logo.png',
      operation: 'read',
      req,
    })

    expect(response.status).toBe(304)
  })

  it('should return a readable body for operation "transform"', async () => {
    const client = makeClient()

    const response = await getFile({
      bucket: 'test-bucket',
      client,
      collection,
      filename: 'logo.png',
      operation: 'transform',
      req: makeReq(),
    })

    expect(await response.text()).toBe('image-bytes')
  })

  it('should preserve a 404 for a missing object regardless of operation', async () => {
    const notFoundError = Object.assign(new ApiError('not found'), { code: 404 })
    const client = makeClient({
      getMetadata: vi.fn().mockRejectedValue(notFoundError),
    })

    const response = await getFile({
      bucket: 'test-bucket',
      client,
      collection,
      filename: 'missing.png',
      operation: 'transform',
      req: makeReq(),
    })

    expect(response.status).toBe(404)
  })
})
