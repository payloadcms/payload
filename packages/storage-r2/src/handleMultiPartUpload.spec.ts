import type { PayloadRequest } from 'payload'

import { createClientUploadReceipt } from 'payload/internal'
import { describe, expect, it, vi } from 'vitest'

import type { R2Bucket } from './types.js'

import { getHandleMultiPartUpload } from './handleMultiPartUpload.js'

describe('getHandleMultiPartUpload', () => {
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
      user: { id: 'user-id' },
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

  describe('continuation', () => {
    const createContinuationRequest = ({
      multipartKey,
      multipartNumber,
      receiptPrefix,
      withReceipt = true,
    }: {
      multipartKey: string
      multipartNumber?: string
      receiptPrefix: string
      withReceipt?: boolean
    }) => {
      const req = {
        arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(0)),
        user: { id: 'user' },
        json: vi.fn().mockResolvedValue([]),
        payload: {
          collections: { media: { config: { access: {}, upload: true } } },
          db: { findOne: vi.fn().mockResolvedValue(null) },
          secret: 'test-secret',
        },
      } as unknown as PayloadRequest

      const signedReceipt = createClientUploadReceipt({
        collectionSlug: 'media',
        context: { prefix: receiptPrefix },
        filename: 'photo.png',
        req,
      })

      ;(req as { searchParams?: URLSearchParams }).searchParams = new URLSearchParams({
        collection: 'media',
        fileName: 'photo.png',
        fileType: 'image/png',
        multipartId: 'upload-id',
        multipartKey,
        ...(multipartNumber === undefined ? {} : { multipartNumber }),
        ...(withReceipt ? { signedReceipt } : {}),
      })

      return req
    }

    const createHandler = () => {
      const resumeMultipartUpload = vi.fn(() => ({
        complete: vi.fn().mockResolvedValue({ key: 'media/documents/photo.png' }),
        uploadPart: vi.fn().mockResolvedValue({ etag: 'etag', partNumber: 1 }),
      }))

      return {
        handler: getHandleMultiPartUpload({
          access: async () => true,
          bucket: { resumeMultipartUpload } as unknown as R2Bucket,
          collections: { media: { prefix: 'media' } },
        }),
        resumeMultipartUpload,
      }
    }

    it('should reject a key outside the receipt', async () => {
      const { handler, resumeMultipartUpload } = createHandler()

      await expect(
        handler(
          createContinuationRequest({
            multipartKey: 'media-archive/photo.png',
            multipartNumber: '1',
            receiptPrefix: 'media/documents',
          }),
        ),
      ).rejects.toMatchObject({ status: 400 })
      expect(resumeMultipartUpload).not.toHaveBeenCalled()
    })

    it('should reject a continuation with no receipt', async () => {
      const { handler, resumeMultipartUpload } = createHandler()

      await expect(
        handler(
          createContinuationRequest({
            multipartKey: 'media/documents/photo.png',
            multipartNumber: '1',
            receiptPrefix: 'media/documents',
            withReceipt: false,
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
          multipartNumber: '1',
          receiptPrefix: 'media/documents',
        }),
      )

      expect(response.status).toBe(200)
      expect(resumeMultipartUpload).toHaveBeenCalledWith('media/documents/photo.png', 'upload-id')
    })
  })
})
