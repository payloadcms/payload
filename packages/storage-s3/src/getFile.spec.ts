import type { CollectionConfig, PayloadRequest } from 'payload'

import { Readable } from 'stream'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@aws-sdk/client-s3', () => ({
  GetObjectCommand: vi.fn(),
}))

vi.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: vi.fn(),
}))

vi.mock('@payloadcms/plugin-cloud-storage/utilities', () => ({
  getFileKey: vi.fn(() => ({ fileKey: 'logo.png' })),
  getFilePrefix: vi.fn().mockResolvedValue(''),
}))

import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

import { getFile } from './getFile.js'

const FILE_SIZE = 1000

const makeReadableBody = (): AsyncIterable<Uint8Array> & Readable => {
  const stream = Readable.from([Buffer.from('image-bytes')])
  return stream as AsyncIterable<Uint8Array> & Readable
}

const makeClient = (overrides: Record<string, unknown> = {}) =>
  ({
    getObject: vi.fn().mockResolvedValue({ Body: makeReadableBody() }),
    headObject: vi.fn().mockResolvedValue({ ContentLength: FILE_SIZE, ContentType: 'image/png' }),
    ...overrides,
  }) as never

const makeReq = (rangeHeader: null | string = null): PayloadRequest =>
  ({
    headers: new Headers(rangeHeader ? { range: rangeHeader } : {}),
    payload: { logger: { error: vi.fn() } },
    signal: undefined,
  }) as unknown as PayloadRequest

const collection = {} as CollectionConfig

describe('storage-s3 getFile', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getSignedUrl).mockResolvedValue('https://signed.example.com/logo.png')
  })

  it('should redirect to a signed URL for operation "read" when signedDownloads is enabled (regression)', async () => {
    const client = makeClient()

    const response = await getFile({
      bucket: 'test-bucket',
      client,
      collection,
      filename: 'logo.png',
      operation: 'read',
      req: makeReq(),
      signedDownloads: true,
    })

    expect(response.status).toBe(302)
    expect(response.headers.get('Location')).toBe('https://signed.example.com/logo.png')
    expect(client.getObject).not.toHaveBeenCalled()
  })

  it('should never redirect for operation "transform", even when signedDownloads is enabled', async () => {
    const client = makeClient()

    const response = await getFile({
      bucket: 'test-bucket',
      client,
      collection,
      filename: 'logo.png',
      operation: 'transform',
      req: makeReq(),
      signedDownloads: true,
    })

    expect(response.status).toBe(200)
    expect(getSignedUrl).not.toHaveBeenCalled()
    expect(client.getObject).toHaveBeenCalledTimes(1)
  })

  it('should call getObject without a Range for operation "transform"', async () => {
    const client = makeClient()

    await getFile({
      bucket: 'test-bucket',
      client,
      collection,
      filename: 'logo.png',
      operation: 'transform',
      req: makeReq('bytes=0-99'),
      signedDownloads: true,
    })

    const callArgs = client.getObject.mock.calls[0]?.[0]
    expect(callArgs.Range).toBeUndefined()
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
      signedDownloads: false,
    })

    expect(response.status).toBe(206)
    const callArgs = client.getObject.mock.calls[0]?.[0]
    expect(callArgs.Range).toBe('bytes=0-99')
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
      signedDownloads: false,
    })

    expect(response.status).toBe(200)
    const callArgs = client.getObject.mock.calls[0]?.[0]
    expect(callArgs.Range).toBeUndefined()
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
      signedDownloads: false,
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
      signedDownloads: false,
    })

    expect(modifyResponseHeaders).toHaveBeenCalledTimes(1)
  })

  it('should skip the ETag 304 short-circuit for operation "transform"', async () => {
    const client = makeClient({
      headObject: vi.fn().mockResolvedValue({
        ContentLength: FILE_SIZE,
        ContentType: 'image/png',
        ETag: 'matching-etag',
      }),
    })
    const req = makeReq()
    req.headers.set('if-none-match', 'matching-etag')

    const response = await getFile({
      bucket: 'test-bucket',
      client,
      collection,
      filename: 'logo.png',
      operation: 'transform',
      req,
      signedDownloads: false,
    })

    expect(response.status).toBe(200)
    expect(client.getObject).toHaveBeenCalledTimes(1)
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
      signedDownloads: false,
    })

    expect(await response.text()).toBe('image-bytes')
  })

  it('should preserve a 404 for a missing object regardless of operation', async () => {
    const client = makeClient({
      headObject: vi.fn().mockRejectedValue({ httpStatusCode: 404, name: 'NotFound' }),
    })

    const response = await getFile({
      bucket: 'test-bucket',
      client,
      collection,
      filename: 'missing.png',
      operation: 'transform',
      req: makeReq(),
      signedDownloads: false,
    })

    expect(response.status).toBe(404)
  })
})
