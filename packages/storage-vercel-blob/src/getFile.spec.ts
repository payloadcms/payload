import type { CollectionConfig, PayloadRequest } from 'payload'

import { BlobNotFoundError } from '@vercel/blob'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@payloadcms/plugin-cloud-storage/utilities', () => ({
  getFileKey: vi.fn((args: { filename: string }) => ({ fileKey: args.filename })),
  getFilePrefix: vi.fn().mockResolvedValue(''),
}))

vi.mock('@vercel/blob', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@vercel/blob')>()
  return {
    ...actual,
    head: vi.fn(),
  }
})

vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('image-bytes', { status: 200 })))

import { head } from '@vercel/blob'

import { getFile } from './getFile.js'

const FILE_SIZE = 1000

const makeHeadResult = () => ({
  contentDisposition: 'inline',
  contentType: 'image/png',
  size: FILE_SIZE,
  uploadedAt: new Date('2024-01-01T00:00:00.000Z'),
})

const makeReq = (rangeHeader: null | string = null): PayloadRequest =>
  ({
    headers: new Headers(rangeHeader ? { range: rangeHeader } : {}),
    payload: { logger: { error: vi.fn() } },
  }) as unknown as PayloadRequest

const collection = {} as CollectionConfig

describe('storage-vercel-blob getFile', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(head).mockResolvedValue(makeHeadResult() as never)
    vi.mocked(fetch).mockResolvedValue(new Response('image-bytes', { status: 200 }))
  })

  it('should honor an incoming Range header for operation "read" (regression)', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response('image-bytes', { status: 206 }))

    const response = await getFile({
      baseUrl: 'https://blob.example.com',
      cacheControlMaxAge: 3600,
      collection,
      filename: 'logo.png',
      operation: 'read',
      req: makeReq('bytes=0-99'),
      token: 'test-token',
    })

    expect(vi.mocked(fetch).mock.calls[0]?.[1]?.headers).toMatchObject({
      Range: 'bytes=0-99',
    })
    expect(response.status).toBe(206)
  })

  it('should ignore an incoming Range header for operation "transform"', async () => {
    await getFile({
      baseUrl: 'https://blob.example.com',
      cacheControlMaxAge: 3600,
      collection,
      filename: 'logo.png',
      operation: 'transform',
      req: makeReq('bytes=0-99'),
      token: 'test-token',
    })

    const fetchHeaders = vi.mocked(fetch).mock.calls[0]?.[1]?.headers as Record<string, string>
    expect(fetchHeaders.Range).toBeUndefined()
  })

  it('should not return 416 for an out-of-bounds Range header when operation is "transform"', async () => {
    const response = await getFile({
      baseUrl: 'https://blob.example.com',
      cacheControlMaxAge: 3600,
      collection,
      filename: 'logo.png',
      operation: 'transform',
      req: makeReq('bytes=999999-9999999'),
      token: 'test-token',
    })

    expect(response.status).toBe(200)
    const fetchHeaders = vi.mocked(fetch).mock.calls[0]?.[1]?.headers as Record<string, string>
    expect(fetchHeaders.Range).toBeUndefined()
  })

  it('should not call modifyResponseHeaders for operation "transform"', async () => {
    const modifyResponseHeaders = vi.fn(({ headers }) => headers)

    await getFile({
      baseUrl: 'https://blob.example.com',
      cacheControlMaxAge: 3600,
      collection: { upload: { modifyResponseHeaders } } as unknown as CollectionConfig,
      filename: 'logo.png',
      operation: 'transform',
      req: makeReq(),
      token: 'test-token',
    })

    expect(modifyResponseHeaders).not.toHaveBeenCalled()
  })

  it('should call modifyResponseHeaders for operation "read" (regression)', async () => {
    const modifyResponseHeaders = vi.fn(({ headers }) => headers)

    await getFile({
      baseUrl: 'https://blob.example.com',
      cacheControlMaxAge: 3600,
      collection: { upload: { modifyResponseHeaders } } as unknown as CollectionConfig,
      filename: 'logo.png',
      operation: 'read',
      req: makeReq(),
      token: 'test-token',
    })

    expect(modifyResponseHeaders).toHaveBeenCalledTimes(1)
  })

  it('should skip the ETag 304 short-circuit for operation "transform"', async () => {
    const req = makeReq()
    req.headers.set('if-none-match', `"logo.png-2024-01-01T00:00:00.000Z"`)

    const response = await getFile({
      baseUrl: 'https://blob.example.com',
      cacheControlMaxAge: 3600,
      collection,
      filename: 'logo.png',
      operation: 'transform',
      req,
      token: 'test-token',
    })

    expect(response.status).toBe(200)
  })

  it('should return a readable body for operation "transform"', async () => {
    const response = await getFile({
      baseUrl: 'https://blob.example.com',
      cacheControlMaxAge: 3600,
      collection,
      filename: 'logo.png',
      operation: 'transform',
      req: makeReq(),
      token: 'test-token',
    })

    expect(await response.text()).toBe('image-bytes')
  })

  it('should preserve a 404 for a missing object regardless of operation', async () => {
    vi.mocked(head).mockRejectedValue(new BlobNotFoundError())

    const response = await getFile({
      baseUrl: 'https://blob.example.com',
      cacheControlMaxAge: 3600,
      collection,
      filename: 'missing.png',
      operation: 'transform',
      req: makeReq(),
      token: 'test-token',
    })

    expect(response.status).toBe(404)
  })

  it('should return 204 for a failed source fetch when operation is "read" (regression)', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(null, { status: 500 }))

    const response = await getFile({
      baseUrl: 'https://blob.example.com',
      cacheControlMaxAge: 3600,
      collection,
      filename: 'logo.png',
      operation: 'read',
      req: makeReq(),
      token: 'test-token',
    })

    expect(response.status).toBe(204)
  })

  it('should propagate the real failure status for operation "transform" instead of masking it as 204', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(null, { status: 500 }))

    const response = await getFile({
      baseUrl: 'https://blob.example.com',
      cacheControlMaxAge: 3600,
      collection,
      filename: 'logo.png',
      operation: 'transform',
      req: makeReq(),
      token: 'test-token',
    })

    expect(response.status).toBe(500)
  })
})
