import type { PayloadRequest } from 'payload'

import { describe, expect, it, vi } from 'vitest'

import type { R2Bucket } from './types.js'

import { getHandleMultiPartUpload } from './handleMultiPartUpload.js'

describe('getHandleMultiPartUpload', () => {
  it('should reject multipart uploads when the object already exists', async () => {
    const createMultipartUpload = vi.fn().mockResolvedValue({
      key: 'reference.png',
      uploadId: 'upload-id',
    })
    const bucket = {
      createMultipartUpload,
      head: vi.fn().mockResolvedValue({ key: 'reference.png' }),
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
        fileName: 'reference.png',
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
