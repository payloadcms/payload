import type { CollectionConfig, PayloadRequest } from 'payload'

import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@payloadcms/plugin-cloud-storage/utilities', () => ({
  buildStoragePathData: vi.fn(() => ({ storageFilePath: 'logo.png' })),
  getFilePrefix: vi.fn().mockResolvedValue(''),
}))

import { getFile } from './getFile.js'

const LARGE_FILE_SIZE = 60 * 1024 * 1024

const makeBody = (): ReadableStream =>
  new ReadableStream({
    start(controller) {
      controller.enqueue(new TextEncoder().encode('image-bytes'))
      controller.close()
    },
  })

const makeBucket = () => ({
  get: vi.fn().mockResolvedValue({
    body: makeBody(),
    etag: 'etag-1',
    writeHttpMetadata: vi.fn((headers: Headers) => {
      headers.set('Content-Type', 'image/png')
    }),
  }),
  head: vi.fn().mockResolvedValue({ size: LARGE_FILE_SIZE }),
})

const makeReq = (): PayloadRequest =>
  ({
    headers: new Headers(),
    payload: { logger: { error: vi.fn() } },
  }) as unknown as PayloadRequest

const collection = {} as CollectionConfig

describe('storage-r2 getFile', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should preserve the existing empty-body guard for a large internal uploadReference read when operation is "read" (regression)', async () => {
    const bucket = makeBucket()

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

  it('should not return an empty body for an object over 50MB when operation is "transform", even if uploadReference is present', async () => {
    const bucket = makeBucket()

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
})
