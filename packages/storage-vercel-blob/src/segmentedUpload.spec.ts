import type { PayloadRequest, ReservedObject } from 'payload'

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  completeMultipartUpload: vi.fn(),
  createMultipartUpload: vi.fn(),
  del: vi.fn(),
  generateClientToken: vi.fn(),
  head: vi.fn(),
  list: vi.fn(),
  resolveSignedURLKey: vi.fn(),
  uploadPart: vi.fn(),
}))

vi.mock('@payloadcms/plugin-cloud-storage/utilities', () => ({
  resolveSignedURLKey: mocks.resolveSignedURLKey,
}))

vi.mock('@vercel/blob', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@vercel/blob')>()),
  completeMultipartUpload: mocks.completeMultipartUpload,
  createMultipartUpload: mocks.createMultipartUpload,
  del: mocks.del,
  head: mocks.head,
  list: mocks.list,
  uploadPart: mocks.uploadPart,
}))

vi.mock('@vercel/blob/client', () => ({
  generateClientTokenFromReadWriteToken: mocks.generateClientToken,
}))

import { BlobNotFoundError, BlobStoreNotFoundError } from '@vercel/blob'
import { APIError } from 'payload'

import { createSegmentedUpload, UPLOAD_STAGING_PREFIX } from './segmentedUpload.js'

const MiB = 1024 * 1024

const object: ReservedObject = {
  _objectKey: 'key',
  filename: 'video.mp4',
  prefix: '',
  storageFilePath: 'key/video.mp4',
}

const stagingPrefix = `${UPLOAD_STAGING_PREFIX}key/video.mp4/`

const req = { payload: { config: { upload: {} } } } as unknown as PayloadRequest

const createCapability = () =>
  createSegmentedUpload({
    baseUrl: 'https://store.public.blob.vercel-storage.com',
    blobAccess: 'public',
    cacheControlMaxAge: 60,
    collection: {
      slug: 'videos',
      fields: [],
      upload: { transfer: { preferredSegmentSize: 5 * MiB } },
    },
    collectionPrefix: '',
    token: 'vercel_blob_rw_store_secret',
  })

const stagedBlob = ({ name, size }: { name: string; size: number }) => ({
  pathname: `${stagingPrefix}${name}`,
  size,
  url: `https://store.public.blob.vercel-storage.com/${stagingPrefix}${name}`,
})

describe('Vercel Blob segmented uploads', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.generateClientToken.mockImplementation(
      ({ pathname }: { pathname: string }) => `client-token:${pathname}`,
    )
    mocks.list.mockResolvedValue({ blobs: [], hasMore: false })
    mocks.head.mockRejectedValue(new BlobNotFoundError())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('should send each segment to its own staged pathname with a token scoped to it', async () => {
    const requests = await createCapability().getSegmentRequests({
      collectionSlug: 'videos',
      expiresIn: 900,
      mimeType: 'video/mp4',
      object,
      providerState: { contentType: 'video/mp4' },
      req,
      segments: [
        { end: 5 * MiB, number: 1, start: 0 },
        { end: 6 * MiB, number: 2, start: 5 * MiB },
      ],
    })

    expect(requests.map(({ url }) => new URL(url).searchParams.get('pathname'))).toEqual([
      `${stagingPrefix}00001`,
      `${stagingPrefix}00002`,
    ])
    expect(requests[1]).toMatchObject({
      headers: { authorization: `Bearer client-token:${stagingPrefix}00002` },
      method: 'PUT',
      number: 2,
    })
    expect(mocks.generateClientToken).toHaveBeenCalledWith(
      expect.objectContaining({
        addRandomSuffix: false,
        maximumSizeInBytes: MiB,
        pathname: `${stagingPrefix}00002`,
      }),
    )
  })

  it('should reconcile staged parts and ignore unrelated blobs', async () => {
    mocks.list
      .mockResolvedValueOnce({
        blobs: [stagedBlob({ name: '00002', size: 3 }), stagedBlob({ name: 'other', size: 1 })],
        cursor: 'next',
        hasMore: true,
      })
      .mockResolvedValueOnce({ blobs: [stagedBlob({ name: '00001', size: 5 })], hasMore: false })

    const reconciled = await createCapability().reconcile({
      object,
      providerState: { contentType: 'video/mp4' },
      req,
    })

    expect(reconciled).toEqual([
      { number: 2, size: 3 },
      { number: 1, size: 5 },
    ])
    expect(mocks.list).toHaveBeenLastCalledWith(expect.objectContaining({ cursor: 'next' }))
  })

  it('should reconcile from the final blob once staged parts were removed', async () => {
    mocks.head.mockResolvedValue({ size: 11 * MiB })

    const reconciled = await createCapability().reconcile({
      object,
      providerState: { contentType: 'video/mp4' },
      req,
    })

    expect(reconciled).toEqual([
      { number: 1, size: 5 * MiB },
      { number: 2, size: 5 * MiB },
      { number: 3, size: MiB },
    ])
  })

  it('should assemble staged parts in order, then remove them', async () => {
    const parts = { 1: Buffer.alloc(5, 1), 2: Buffer.alloc(2, 2) }

    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => new Response(parts[Number(url.slice(-5)) as 1 | 2])),
    )
    mocks.createMultipartUpload.mockResolvedValue({ key: 'mpu-key', uploadId: 'mpu-id' })
    mocks.uploadPart.mockImplementation(
      async (_path: string, _body: Buffer, { partNumber }: { partNumber: number }) => ({
        etag: `etag-${partNumber}`,
        partNumber,
      }),
    )
    mocks.list.mockResolvedValue({
      blobs: [stagedBlob({ name: '00001', size: 5 }), stagedBlob({ name: '00002', size: 2 })],
      hasMore: false,
    })
    mocks.head.mockRejectedValueOnce(new BlobNotFoundError()).mockResolvedValue({ size: 7 })

    const result = await createCapability().complete({
      object,
      providerState: { contentType: 'video/mp4' },
      req,
      segments: [
        { number: 2, size: 2 },
        { number: 1, size: 5 },
      ],
    })

    expect(result).toEqual({ size: 7 })
    expect(mocks.createMultipartUpload).toHaveBeenCalledWith(
      'key/video.mp4',
      expect.objectContaining({ allowOverwrite: false, contentType: 'video/mp4' }),
    )
    expect(mocks.completeMultipartUpload).toHaveBeenCalledWith(
      'key/video.mp4',
      [
        { etag: 'etag-1', partNumber: 1 },
        { etag: 'etag-2', partNumber: 2 },
      ],
      expect.objectContaining({ key: 'mpu-key', uploadId: 'mpu-id' }),
    )
    expect(mocks.del).toHaveBeenCalledWith(
      [stagedBlob({ name: '00001', size: 5 }).url, stagedBlob({ name: '00002', size: 2 }).url],
      expect.anything(),
    )
  })

  it('should not assemble a staged part that is shorter than listed', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(Buffer.alloc(3))),
    )
    mocks.createMultipartUpload.mockResolvedValue({ key: 'mpu-key', uploadId: 'mpu-id' })

    await expect(
      createCapability().complete({
        object,
        providerState: { contentType: 'video/mp4' },
        req,
        segments: [{ number: 1, size: 5 }],
      }),
    ).rejects.toThrow('does not have its listed size')
    expect(mocks.completeMultipartUpload).not.toHaveBeenCalled()
  })

  it('should treat an existing final blob as a completed retry', async () => {
    mocks.head.mockResolvedValue({ size: 7 })

    const result = await createCapability().complete({
      object,
      providerState: { contentType: 'video/mp4' },
      req,
      segments: [{ number: 1, size: 7 }],
    })

    expect(result).toEqual({ size: 7 })
    expect(mocks.createMultipartUpload).not.toHaveBeenCalled()
  })

  it('should remove staged parts and an orphaned final blob on abort', async () => {
    mocks.list.mockResolvedValue({
      blobs: [stagedBlob({ name: '00001', size: 5 })],
      hasMore: false,
    })
    mocks.head.mockResolvedValue({ size: 5 })

    await createCapability().abort({ object, providerState: { contentType: 'video/mp4' }, req })

    expect(mocks.del).toHaveBeenCalledWith(
      [stagedBlob({ name: '00001', size: 5 }).url],
      expect.anything(),
    )
    expect(mocks.del).toHaveBeenCalledWith('key/video.mp4', expect.anything())
  })

  it('should fail permanently when the store does not exist', async () => {
    mocks.resolveSignedURLKey.mockResolvedValue({
      sanitizedFilename: 'video.mp4',
      storageFilePath: 'key/video.mp4',
      uploadReference: { _objectKey: 'key', prefix: '' },
    })
    mocks.list.mockRejectedValue(new BlobStoreNotFoundError())

    const error = await createCapability()
      .initiate({ collectionSlug: 'videos', filename: 'video.mp4', mimeType: 'video/mp4', req })
      .catch((err: unknown) => err)

    expect(error).toBeInstanceOf(APIError)
    expect((error as APIError).status).toBe(404)
  })
})
