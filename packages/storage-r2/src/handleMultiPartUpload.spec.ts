import type { PayloadRequest } from 'payload'

import { createClientUploadReceipt } from 'payload/internal'
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
            access: {},
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
    user: { id: 'user' },
  }) as unknown as PayloadRequest

const createContinuationRequest = ({ multipartKey }: { multipartKey: string }) => {
  const req = {
    arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(0)),
    user: { id: 'user' },
    payload: {
      collections: {
        media: { config: { slug: 'media', access: {}, upload: { staticDir: '/tmp' } } },
      },
      secret: 'test-secret',
    },
  } as unknown as PayloadRequest

  const signedReceipt = createClientUploadReceipt({
    collectionSlug: 'media',
    filePrefix: 'media/documents',
    filename: 'photo.png',
    req,
    storageFilePath: 'media/documents/photo.png',
  })

  ;(req as { searchParams?: URLSearchParams }).searchParams = new URLSearchParams({
    collection: 'media',
    fileName: 'photo.png',
    fileType: 'image/png',
    multipartId: 'upload-id',
    multipartKey,
    multipartNumber: '1',
    signedReceipt,
  })

  return req
}

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

  describe('continuation', () => {
    const createHandler = () => {
      const resumeMultipartUpload = vi.fn(() => ({
        uploadPart: vi.fn().mockResolvedValue({ etag: 'etag', partNumber: 1 }),
      }))

      return {
        handler: getHandleMultiPartUpload({
          access: () => true,
          bucket: { resumeMultipartUpload } as unknown as R2Bucket,
          collections: { media: { prefix: 'media' } },
        }),
        resumeMultipartUpload,
      }
    }

    it('should reject a continuation key outside the receipt', async () => {
      const { handler, resumeMultipartUpload } = createHandler()

      await expect(
        handler(
          createContinuationRequest({
            multipartKey: 'media-archive/photo.png',
          }),
        ),
      ).rejects.toMatchObject({ status: 400 })
      expect(resumeMultipartUpload).not.toHaveBeenCalled()
    })

    it('should resume the upload issued by the receipt', async () => {
      const { handler, resumeMultipartUpload } = createHandler()

      const response = await handler(
        createContinuationRequest({
          multipartKey: 'media/documents/photo.png',
        }),
      )

      expect(response.status).toBe(200)
      expect(resumeMultipartUpload).toHaveBeenCalledWith('media/documents/photo.png', 'upload-id')
    })
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
          media: { config: { access: {}, upload: true } },
        },
        db: { findOne: vi.fn().mockResolvedValue(null) },
      },
      searchParams: new URLSearchParams({
        collection: 'media',
        fileName: 'protected.png',
        fileType: 'image/png',
      }),
      user: { id: 'user' },
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
