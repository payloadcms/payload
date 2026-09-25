import type { CollectionConfig, PayloadRequest } from 'payload'

import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@payloadcms/plugin-cloud-storage/utilities', () => ({
  buildStoragePathData: vi.fn((args: { filename: string }) => ({
    storageFilePath: args.filename,
  })),
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

const makeReq = (): PayloadRequest =>
  ({
    headers: new Headers(),
    payload: { logger: { error: vi.fn() } },
  }) as unknown as PayloadRequest

const collection = {} as CollectionConfig

describe('storage-vercel-blob getFile', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(head).mockResolvedValue(makeHeadResult() as never)
    vi.mocked(fetch).mockResolvedValue(new Response('image-bytes', { status: 200 }))
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
