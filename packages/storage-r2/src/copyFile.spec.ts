import { expect, it, vi } from 'vitest'

import { createR2Adapter } from './adapter.js'

const copyS3File = vi.fn().mockResolvedValue(undefined)
const destroy = vi.fn()

vi.mock('@aws-sdk/client-s3', () => ({
  S3: class S3 {
    destroy = destroy
  },
}))
vi.mock('@payloadcms/storage-s3/copy-file', () => ({ copyS3File }))

it('should reject a copy without S3 credentials before changing the Workers bucket', async () => {
  const bucket = { delete: vi.fn(), put: vi.fn() }
  const adapter = createR2Adapter({ bucket: bucket as never, collections: {} })({
    collection: { slug: 'media' } as never,
  })

  await expect(adapter.copyFile({ from: 'a.png', to: 'b.png' } as never)).rejects.toThrow(
    'requires S3 API credentials',
  )
  expect(bucket.delete).not.toHaveBeenCalled()
  expect(bucket.put).not.toHaveBeenCalled()

  await adapter.handleUpload({
    file: { buffer: Buffer.from('bytes'), mimeType: 'image/png' },
    storageFilePath: 'a.png',
  } as never)

  expect(bucket.put).toHaveBeenCalledOnce()
})

it('should use the configured R2 S3 API for copy-dependent operations', async () => {
  const adapter = createR2Adapter({
    bucket: {} as never,
    collections: {},
    copyCredentials: {
      accessKeyId: 'access',
      accountId: 'account',
      bucket: 'media',
      secretAccessKey: 'secret',
    },
  })({ collection: { slug: 'media' } as never })

  await adapter.copyFile({ from: 'source.png', to: 'archive.png' } as never)

  expect(copyS3File).toHaveBeenCalledWith(
    expect.objectContaining({ bucket: 'media', from: 'source.png', to: 'archive.png' }),
  )
  expect(destroy).toHaveBeenCalledOnce()
})
