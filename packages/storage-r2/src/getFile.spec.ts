import type { CollectionConfig, PayloadRequest } from 'payload'

import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@payloadcms/plugin-cloud-storage/utilities', () => ({
  getFileKey: vi.fn(() => ({ fileKey: 'logo.png' })),
  getFilePrefix: vi.fn().mockResolvedValue(''),
}))

import { getFile } from './getFile.js'

const FILE_SIZE = 1000
const LARGE_FILE_SIZE = 60 * 1024 * 1024

const makeBody = (): ReadableStream =>
  new ReadableStream({
    start(controller) {
      controller.enqueue(new TextEncoder().encode('image-bytes'))
      controller.close()
    },
  })

const makeBucket = ({
  etag = 'etag-1',
  headResult = { size: FILE_SIZE },
}: { etag?: string; headResult?: { size: number } | null } = {}) => ({
  get: vi.fn().mockResolvedValue({
    body: makeBody(),
    etag,
    writeHttpMetadata: vi.fn((headers: Headers) => {
      headers.set('Content-Type', 'image/png')
    }),
  }),
  head: vi.fn().mockResolvedValue(headResult),
})

const makeReq = (rangeHeader: null | string = null): PayloadRequest =>
  ({
    headers: new Headers(rangeHeader ? { range: rangeHeader } : {}),
    payload: { logger: { error: vi.fn() } },
  }) as unknown as PayloadRequest

const collection = {} as CollectionConfig

describe('storage-r2 getFile', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should honor an incoming Range header for operation "read" (regression)', async () => {
    const bucket = makeBucket()

    const response = await getFile({
      bucket: bucket as never,
      collection,
      filename: 'logo.png',
      prefix: '',
      operation: 'read',
      req: makeReq('bytes=0-99'),
    })

    expect(response.status).toBe(206)
  })

  it('should ignore an incoming Range header for operation "transform"', async () => {
    const bucket = makeBucket()

    const response = await getFile({
      bucket: bucket as never,
      collection,
      filename: 'logo.png',
      prefix: '',
      operation: 'transform',
      req: makeReq('bytes=0-99'),
    })

    expect(response.status).toBe(200)
  })

  it('should not return 416 for an out-of-bounds Range header when operation is "transform"', async () => {
    const bucket = makeBucket()

    const response = await getFile({
      bucket: bucket as never,
      collection,
      filename: 'logo.png',
      prefix: '',
      operation: 'transform',
      req: makeReq('bytes=999999-9999999'),
    })

    expect(response.status).toBe(200)
  })

  it('should not call modifyResponseHeaders for operation "transform"', async () => {
    const modifyResponseHeaders = vi.fn((args: { headers: Headers }) => args.headers)
    const bucket = makeBucket()

    await getFile({
      bucket: bucket as never,
      collection: { upload: { modifyResponseHeaders } } as unknown as CollectionConfig,
      filename: 'logo.png',
      prefix: '',
      operation: 'transform',
      req: makeReq(),
    })

    expect(modifyResponseHeaders).not.toHaveBeenCalled()
  })

  it('should call modifyResponseHeaders for operation "read" (regression)', async () => {
    const modifyResponseHeaders = vi.fn((args: { headers: Headers }) => args.headers)
    const bucket = makeBucket()

    await getFile({
      bucket: bucket as never,
      collection: { upload: { modifyResponseHeaders } } as unknown as CollectionConfig,
      filename: 'logo.png',
      prefix: '',
      operation: 'read',
      req: makeReq(),
    })

    expect(modifyResponseHeaders).toHaveBeenCalledTimes(1)
  })

  it('should skip the ETag 304 short-circuit for operation "transform"', async () => {
    const bucket = makeBucket()
    const req = makeReq()
    req.headers.set('if-none-match', 'etag-1')

    const response = await getFile({
      bucket: bucket as never,
      collection,
      filename: 'logo.png',
      prefix: '',
      operation: 'transform',
      req,
    })

    expect(response.status).toBe(200)
  })

  it('should honor the ETag 304 short-circuit for operation "read" (regression)', async () => {
    const bucket = makeBucket()
    const req = makeReq()
    req.headers.set('if-none-match', 'etag-1')

    const response = await getFile({
      bucket: bucket as never,
      collection,
      filename: 'logo.png',
      prefix: '',
      operation: 'read',
      req,
    })

    expect(response.status).toBe(304)
  })

  it('should return a readable body for operation "transform"', async () => {
    const bucket = makeBucket()

    const response = await getFile({
      bucket: bucket as never,
      collection,
      filename: 'logo.png',
      prefix: '',
      operation: 'transform',
      req: makeReq(),
    })

    expect(await response.text()).toBe('image-bytes')
  })

  it('should preserve a 404 for a missing object regardless of operation', async () => {
    const bucket = makeBucket({ headResult: null })

    const response = await getFile({
      bucket: bucket as never,
      collection,
      filename: 'missing.png',
      prefix: '',
      operation: 'transform',
      req: makeReq(),
    })

    expect(response.status).toBe(404)
  })

  it('should return the real body for an object over 50MB when operation is "read" and no uploadReference is present (regression)', async () => {
    const bucket = makeBucket({ headResult: { size: LARGE_FILE_SIZE } })

    const response = await getFile({
      bucket: bucket as never,
      collection,
      filename: 'large.png',
      prefix: '',
      operation: 'read',
      req: makeReq(),
    })

    expect(response.status).toBe(200)
    expect(await response.text()).toBe('image-bytes')
  })

  it('should not return an empty body for an object over 50MB when operation is "transform", even if uploadReference is present', async () => {
    const bucket = makeBucket({ headResult: { size: LARGE_FILE_SIZE } })

    const response = await getFile({
      bucket: bucket as never,
      collection,
      filename: 'large.png',
      prefix: '',
      operation: 'transform',
      req: makeReq(),
      uploadReference: { id: 'ref-1' },
    })

    expect(response.status).toBe(200)
    expect(await response.text()).toBe('image-bytes')
  })

  it('should preserve the existing empty-body guard for a large internal uploadReference read when operation is "read" (regression)', async () => {
    const bucket = makeBucket({ headResult: { size: LARGE_FILE_SIZE } })

    const response = await getFile({
      bucket: bucket as never,
      collection,
      filename: 'large.png',
      prefix: '',
      operation: 'read',
      req: makeReq(),
      uploadReference: { id: 'ref-1' },
    })

    expect(response.status).toBe(200)
    expect(await response.text()).toBe('')
  })
})
