import { expect, it, vi } from 'vitest'

import { copyS3File } from './copyFile.js'

it.each([false, true])(
  'should copy an object without list permission (%s multipart)',
  async (hasMultipart) => {
    const size = hasMultipart ? 6 * 1024 ** 3 : 10
    const source = { ContentLength: size, ETag: 'source-etag' }
    const objects = new Map([['source', source]])
    const createCopy = ({ IfNoneMatch }: { IfNoneMatch?: string }) => {
      expect(IfNoneMatch).toBe('*')
      objects.set('destination', { ContentLength: size, ETag: 'copy-etag' })
      return Promise.resolve({
        CopyObjectResult: { ETag: 'copy-etag' },
        ETag: 'copy-etag',
      })
    }
    const client = {
      completeMultipartUpload: vi.fn(createCopy),
      copyObject: vi.fn(createCopy),
      createMultipartUpload: vi.fn().mockResolvedValue({ UploadId: 'upload' }),
      getObjectTagging: vi.fn().mockResolvedValue({ TagSet: [] }),
      headObject: vi.fn(({ Key }: { Key: string }) =>
        objects.has(Key)
          ? Promise.resolve(objects.get(Key))
          : Promise.reject(
              Object.assign(new Error('list permission denied'), {
                $metadata: { httpStatusCode: 403 },
                name: 'AccessDenied',
              }),
            ),
      ),
      uploadPartCopy: vi.fn().mockResolvedValue({ CopyPartResult: { ETag: 'part' } }),
    }

    await copyS3File({
      bucket: 'media',
      client: client as never,
      from: 'source',
      to: 'destination',
    })

    expect(objects.get('source')).toEqual(source)
    expect(objects.get('destination')).toEqual({ ContentLength: size, ETag: 'copy-etag' })
    expect(hasMultipart ? client.uploadPartCopy : client.copyObject).toHaveBeenCalledWith(
      expect.objectContaining({ CopySourceIfMatch: 'source-etag' }),
    )
  },
)

it.each([false, true])(
  'should preserve an incomplete multipart copy error even if abort fails (%s)',
  async (hasAbortFailure) => {
    const cleanupError = new Error('abort denied')
    const error = vi.fn()
    const abortMultipartUpload = hasAbortFailure
      ? vi.fn().mockRejectedValue(cleanupError)
      : vi.fn().mockResolvedValue({})
    const deleteObject = vi.fn()
    const client = {
      abortMultipartUpload,
      createMultipartUpload: vi.fn().mockResolvedValue({ UploadId: 'upload-1' }),
      deleteObject,
      getObjectTagging: vi.fn().mockResolvedValue({ TagSet: [] }),
      headObject: vi.fn().mockResolvedValue({ ContentLength: 6 * 1024 ** 3, ETag: 'source' }),
      uploadPartCopy: vi.fn().mockRejectedValue(new Error('copy failed')),
    } as never

    await expect(
      copyS3File({
        bucket: 'media',
        client,
        from: 'large.bin',
        req: { payload: { logger: { error } } } as never,
        to: 'archive.bin',
      }),
    ).rejects.toThrow('copy failed')
    expect(abortMultipartUpload).toHaveBeenCalled()
    expect(deleteObject).not.toHaveBeenCalled()
    if (hasAbortFailure) {
      expect(error).toHaveBeenCalledWith({
        err: cleanupError,
        msg: expect.stringContaining('media/archive.bin'),
      })
    }
  },
)

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

it.each([
  { hasMultipart: false, hasReadFailure: false },
  { hasMultipart: true, hasReadFailure: true },
])(
  'should remove its completed copy after verification fails ($hasMultipart)',
  async ({ hasMultipart, hasReadFailure }) => {
    const size = hasMultipart ? 6 * 1024 ** 3 : 10
    const objects = new Map([['source', { ContentLength: size, ETag: 'source-etag' }]])
    const verificationError = new Error('verification failed')
    const createCopy = () => {
      objects.set('destination', { ContentLength: 1, ETag: 'copy-etag' })
      return Promise.resolve({
        CopyObjectResult: { ETag: 'copy-etag' },
        ETag: 'copy-etag',
        VersionId: 'copy-version',
      })
    }
    const deleteObject = vi.fn(({ Key, IfMatch, VersionId }) => {
      expect(IfMatch).toBe('copy-etag')
      expect(VersionId).toBe('copy-version')
      objects.delete(Key)
      return Promise.resolve({})
    })
    const client = {
      abortMultipartUpload: vi.fn(),
      completeMultipartUpload: vi.fn(createCopy),
      copyObject: vi.fn(createCopy),
      createMultipartUpload: vi.fn().mockResolvedValue({ UploadId: 'upload' }),
      deleteObject,
      getObjectTagging: vi.fn().mockResolvedValue({ TagSet: [] }),
      headObject: vi.fn(({ Key }) => {
        if (Key === 'destination' && objects.has(Key) && hasReadFailure) {
          return Promise.reject(verificationError)
        }
        return objects.has(Key)
          ? Promise.resolve(objects.get(Key))
          : Promise.reject(Object.assign(new Error('missing'), { name: 'NotFound' }))
      }),
      uploadPartCopy: vi.fn().mockResolvedValue({ CopyPartResult: { ETag: 'part' } }),
    }

    await expect(
      copyS3File({ bucket: 'media', client: client as never, from: 'source', to: 'destination' }),
    ).rejects.toThrow(hasReadFailure ? verificationError : 'expected length')
    expect(objects.has('destination')).toBe(false)
    expect(objects.get('source')).toEqual({ ContentLength: size, ETag: 'source-etag' })
    expect(client.abortMultipartUpload).not.toHaveBeenCalled()
  },
)

it.each([
  { hasMultipart: false, hasSourceChanged: false },
  { hasMultipart: true, hasSourceChanged: false },
  { hasMultipart: false, hasSourceChanged: true },
  { hasMultipart: true, hasSourceChanged: true },
])(
  'should preserve stored objects on a copy precondition failure ($hasMultipart multipart, $hasSourceChanged source changed)',
  async ({ hasMultipart, hasSourceChanged }) => {
    const size = hasMultipart ? 6 * 1024 ** 3 : 10
    const source = { ContentLength: size, ETag: 'source-etag' }
    const destination = { ContentLength: 5, ETag: 'occupied-etag' }
    const objects = new Map([['source', source]])

    if (!hasSourceChanged) {
      objects.set('destination', destination)
    }

    const preconditionError = Object.assign(new Error('precondition failed'), {
      $metadata: { httpStatusCode: 412 },
      name: 'PreconditionFailed',
    })
    const cleanupError = new Error('abort denied')
    const error = vi.fn()
    const createCopy = ({ IfNoneMatch }: { IfNoneMatch?: string }) => {
      if (hasSourceChanged || (IfNoneMatch === '*' && objects.has('destination'))) {
        return Promise.reject(preconditionError)
      }
      objects.set('destination', source)
      return Promise.resolve({ CopyObjectResult: { ETag: 'copy' }, ETag: 'copy' })
    }
    const client = {
      abortMultipartUpload: vi.fn().mockRejectedValue(cleanupError),
      completeMultipartUpload: vi.fn(createCopy),
      copyObject: vi.fn(createCopy),
      createMultipartUpload: vi.fn().mockResolvedValue({ UploadId: 'upload' }),
      deleteObject: vi.fn(({ Key }: { Key: string }) => {
        objects.delete(Key)
        return Promise.resolve({})
      }),
      getObjectTagging: vi.fn().mockResolvedValue({ TagSet: [] }),
      headObject: vi.fn(({ Key }: { Key: string }) =>
        objects.has(Key)
          ? Promise.resolve(objects.get(Key))
          : Promise.reject(Object.assign(new Error('missing'), { name: 'NotFound' })),
      ),
      uploadPartCopy: vi.fn(() =>
        hasSourceChanged
          ? Promise.reject(preconditionError)
          : Promise.resolve({ CopyPartResult: { ETag: 'part' } }),
      ),
    }

    await expect(
      copyS3File({
        bucket: 'media',
        client: client as never,
        from: 'source',
        req: { payload: { logger: { error } } } as never,
        to: 'destination',
      }),
    ).rejects.toBe(preconditionError)
    expect(objects.get('source')).toEqual(source)
    expect(objects.get('destination')).toEqual(hasSourceChanged ? undefined : destination)
    expect(client.deleteObject).not.toHaveBeenCalled()
    if (hasMultipart) {
      expect(client.abortMultipartUpload).toHaveBeenCalledWith({
        Bucket: 'media',
        Key: 'destination',
        UploadId: 'upload',
      })
      expect(error).toHaveBeenCalledWith({
        err: cleanupError,
        msg: expect.stringContaining('media/destination'),
      })
    } else {
      expect(client.abortMultipartUpload).not.toHaveBeenCalled()
    }
  },
)

it('should preserve the verification error and log the exact key when S3 cleanup fails', async () => {
  const verificationError = new Error('verification failed')
  const cleanupError = new Error('deletion denied')
  const error = vi.fn()
  const client = {
    copyObject: vi.fn().mockResolvedValue({ CopyObjectResult: { ETag: 'copy' } }),
    deleteObject: vi.fn().mockRejectedValue(cleanupError),
    headObject: vi
      .fn()
      .mockResolvedValueOnce({ ContentLength: 10 })
      .mockRejectedValueOnce(verificationError),
  }

  await expect(
    copyS3File({
      bucket: 'media',
      client: client as never,
      from: 'source',
      to: 'folder/destination',
      req: { payload: { logger: { error } } } as never,
    }),
  ).rejects.toBe(verificationError)
  expect(error).toHaveBeenCalledWith({
    err: cleanupError,
    msg: expect.stringContaining('folder/destination'),
  })
})
