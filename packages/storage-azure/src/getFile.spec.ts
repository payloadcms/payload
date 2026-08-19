import type { CollectionConfig, PayloadRequest } from 'payload'

import { RestError } from '@azure/storage-blob'
import { Readable } from 'stream'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@payloadcms/plugin-cloud-storage/utilities', () => ({
  getFileKey: vi.fn(() => ({ fileKey: 'logo.png' })),
  getFilePrefix: vi.fn().mockResolvedValue(''),
}))

import { getFile } from './getFile.js'

const FILE_SIZE = 1000

const makeReadableStreamBody = () => Readable.from([Buffer.from('image-bytes')])

const makeClient = (overrides: Record<string, unknown> = {}) => {
  const blockBlobClient = {
    download: vi.fn().mockResolvedValue({
      contentType: 'image/png',
      etag: 'etag-1',
      readableStreamBody: makeReadableStreamBody(),
    }),
    getProperties: vi
      .fn()
      .mockResolvedValue({ contentLength: FILE_SIZE, contentType: 'image/png', etag: 'etag-1' }),
    ...overrides,
  }

  return {
    getBlockBlobClient: vi.fn(() => blockBlobClient),
  } as never
}

const makeReq = (rangeHeader: null | string = null): PayloadRequest =>
  ({
    headers: new Headers(rangeHeader ? { range: rangeHeader } : {}),
    payload: { logger: { error: vi.fn() } },
    signal: undefined,
  }) as unknown as PayloadRequest

const collection = {} as CollectionConfig

describe('storage-azure getFile', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should honor an incoming Range header for operation "read" (regression)', async () => {
    const client = makeClient()

    const response = await getFile({
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
      client,
      collection,
      filename: 'logo.png',
      operation: 'transform',
      req: makeReq('bytes=0-99'),
    })

    expect(response.status).toBe(200)
  })

  it('should not return 416 for an out-of-bounds Range header when operation is "transform"', async () => {
    const client = makeClient()

    const response = await getFile({
      client,
      collection,
      filename: 'logo.png',
      operation: 'transform',
      req: makeReq('bytes=999999-9999999'),
    })

    expect(response.status).toBe(200)
  })

  it('should not call modifyResponseHeaders for operation "transform"', async () => {
    const modifyResponseHeaders = vi.fn(({ headers }) => headers)
    const client = makeClient()

    await getFile({
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
      client,
      collection,
      filename: 'logo.png',
      operation: 'transform',
      req: makeReq(),
    })

    expect(await response.text()).toBe('image-bytes')
  })

  it('should preserve a 404 for a missing object regardless of operation', async () => {
    const client = makeClient({
      getProperties: vi.fn().mockRejectedValue(new RestError('not found', { statusCode: 404 })),
    })

    const response = await getFile({
      client,
      collection,
      filename: 'missing.png',
      operation: 'transform',
      req: makeReq(),
    })

    expect(response.status).toBe(404)
  })
})
