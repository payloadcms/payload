import { expect, it, vi } from 'vitest'

import { copyS3File } from './copyFile.js'

it('should copy a small object to an unused key and verify it is readable', async () => {
  const headObject = vi
    .fn()
    .mockResolvedValueOnce({ ContentLength: 12, ETag: 'source' })
    .mockRejectedValueOnce(Object.assign(new Error('missing'), { name: 'NotFound' }))
    .mockResolvedValueOnce({ ContentLength: 12 })
  const copyObject = vi.fn().mockResolvedValue({})
  const client = { copyObject, headObject } as never

  await copyS3File({ bucket: 'media', client, from: 'old/photo.jpg', to: 'history/photo.jpg' })

  expect(copyObject).toHaveBeenCalledWith(
    expect.objectContaining({
      Bucket: 'media',
      CopySource: 'media/old/photo.jpg',
      IfNoneMatch: '*',
      Key: 'history/photo.jpg',
      MetadataDirective: 'COPY',
    }),
  )
  expect(headObject).toHaveBeenNthCalledWith(3, { Bucket: 'media', Key: 'history/photo.jpg' })
})

it('should reject an occupied destination before copying', async () => {
  const copyObject = vi.fn()
  const client = {
    copyObject,
    headObject: vi
      .fn()
      .mockResolvedValueOnce({ ContentLength: 12, ETag: 'source' })
      .mockResolvedValueOnce({ ContentLength: 8 }),
  } as never

  await expect(
    copyS3File({ bucket: 'media', client, from: 'old.jpg', to: 'occupied.jpg' }),
  ).rejects.toThrow()
  expect(copyObject).not.toHaveBeenCalled()
})

it('should abort an incomplete multipart copy without deleting the source', async () => {
  const abortMultipartUpload = vi.fn().mockResolvedValue({})
  const deleteObject = vi.fn()
  const client = {
    abortMultipartUpload,
    createMultipartUpload: vi.fn().mockResolvedValue({ UploadId: 'upload-1' }),
    deleteObject,
    getObjectTagging: vi.fn().mockResolvedValue({ TagSet: [] }),
    headObject: vi
      .fn()
      .mockResolvedValueOnce({ ContentLength: 6 * 1024 ** 3, ETag: 'source' })
      .mockRejectedValueOnce(Object.assign(new Error('missing'), { name: 'NotFound' })),
    uploadPartCopy: vi.fn().mockRejectedValue(new Error('copy failed')),
  } as never

  await expect(
    copyS3File({ bucket: 'media', client, from: 'large.bin', to: 'archive.bin' }),
  ).rejects.toThrow('copy failed')
  expect(abortMultipartUpload).toHaveBeenCalled()
  expect(deleteObject).not.toHaveBeenCalled()
})

it('should preserve metadata and encryption during multipart copy', async () => {
  const size = 6 * 1024 ** 3
  const createMultipartUpload = vi.fn().mockResolvedValue({ UploadId: 'upload-1' })
  const completeMultipartUpload = vi.fn().mockResolvedValue({})
  const uploadPartCopy = vi.fn().mockResolvedValue({ CopyPartResult: { ETag: 'part-etag' } })
  const client = {
    completeMultipartUpload,
    createMultipartUpload,
    getObjectTagging: vi.fn().mockResolvedValue({ TagSet: [{ Key: 'role', Value: 'original' }] }),
    headObject: vi
      .fn()
      .mockResolvedValueOnce({
        ContentLength: size,
        ContentType: 'video/mp4',
        ETag: 'source',
        Metadata: { owner: 'payload' },
        ServerSideEncryption: 'aws:kms',
        SSEKMSKeyId: 'key-1',
      })
      .mockRejectedValueOnce(Object.assign(new Error('missing'), { name: 'NotFound' }))
      .mockResolvedValueOnce({ ContentLength: size }),
    uploadPartCopy,
  } as never

  await copyS3File({ bucket: 'media', client, from: 'source.mp4', to: 'archive.mp4' })

  expect(createMultipartUpload).toHaveBeenCalledWith(
    expect.objectContaining({
      ContentType: 'video/mp4',
      Metadata: { owner: 'payload' },
      SSEKMSKeyId: 'key-1',
      ServerSideEncryption: 'aws:kms',
      Tagging: 'role=original',
    }),
  )
  expect(uploadPartCopy).toHaveBeenCalledTimes(24)
  expect(completeMultipartUpload).toHaveBeenCalledWith(
    expect.objectContaining({ IfNoneMatch: '*', MultipartUpload: { Parts: expect.any(Array) } }),
  )
})
