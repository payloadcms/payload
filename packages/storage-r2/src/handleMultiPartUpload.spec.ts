import type { PayloadRequest } from 'payload'

import { describe, expect, it, vi } from 'vitest'

import type { R2Bucket } from './types.js'

import { getHandleMultiPartUpload } from './handleMultiPartUpload.js'

const createRequest = (filename: string, mimeType: string) =>
  ({
    payload: {
      collections: {
        media: {
          config: {
            slug: 'media',
            upload: { staticDir: '/tmp' },
          },
        },
      },
    },
    searchParams: new URLSearchParams({
      collection: 'media',
      fileName: filename,
      fileType: mimeType,
    }),
  }) as unknown as PayloadRequest

describe('getHandleMultiPartUpload', () => {
  it.each([
    ['reference.svg', 'image/svg+xml'],
    ['reference.xml', 'application/xml'],
  ])('should keep %s with %s in document uploads', async (filename, mimeType) => {
    const createMultipartUpload = vi.fn()
    const handler = getHandleMultiPartUpload({
      access: () => true,
      bucket: { createMultipartUpload } as unknown as R2Bucket,
      collections: { media: {} },
    })

    await expect(handler(createRequest(filename, mimeType))).rejects.toMatchObject({
      status: 400,
    })
    expect(createMultipartUpload).not.toHaveBeenCalled()
  })

  it('rejects multipart uploads when the object already exists', async () => {
    const createMultipartUpload = vi.fn()
    const bucket = {
      createMultipartUpload,
      head: vi.fn().mockResolvedValue({ key: 'protected.png' }),
    } as unknown as R2Bucket
    const req = {
      payload: {
        collections: {
          media: { config: { upload: true } },
        },
        db: { findOne: vi.fn().mockResolvedValue(null) },
      },
      searchParams: new URLSearchParams({
        collection: 'media',
        fileName: 'protected.png',
        fileType: 'image/png',
      }),
    } as unknown as PayloadRequest
    const handler = getHandleMultiPartUpload({
      access: async () => true,
      bucket,
      collections: { media: true },
    })

    const response = await handler(req)

    expect(response.status).toBe(412)
    expect(createMultipartUpload).not.toHaveBeenCalled()
  })
})
