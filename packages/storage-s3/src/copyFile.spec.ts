import { expect, it, vi } from 'vitest'

import { copyS3File } from './copyFile.js'

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
