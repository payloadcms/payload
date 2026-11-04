import type { ContainerClient } from '@azure/storage-blob'
import type { PayloadRequest, ReservedObject } from 'payload'

import { StorageSharedKeyCredential } from '@azure/storage-blob'
import { describe, expect, it, vi } from 'vitest'

import { createSegmentedUpload, UPLOAD_STAGING_PREFIX } from './segmentedUpload.js'

const object: ReservedObject = {
  _objectKey: 'key',
  filename: 'video.mp4',
  prefix: '',
  storageFilePath: 'key/video.mp4',
}

const stagingPath = `${UPLOAD_STAGING_PREFIX}key/video.mp4`

const req = {} as PayloadRequest

const blockID = (number: number) => Buffer.from(String(number).padStart(6, '0')).toString('base64')

const restError = (statusCode: number) => Object.assign(new Error('RestError'), { statusCode })

type BlobMock = Record<string, unknown>

const createCapability = ({
  final = {},
  staging = {},
}: {
  final?: BlobMock
  staging?: BlobMock
}) => {
  const containerClient = {
    credential: new StorageSharedKeyCredential('account', Buffer.from('key').toString('base64')),
    getBlockBlobClient: (name: string) => ({
      name,
      url: `https://account.blob.core.windows.net/media/${name}`,
      ...(name === stagingPath ? staging : final),
    }),
  } as unknown as ContainerClient

  return createSegmentedUpload({
    collectionPrefix: '',
    containerName: 'media',
    getStorageClient: () => containerClient,
  })
}

describe('Azure segmented uploads', () => {
  it('should sign block URLs for the staging blob, never the final path', async () => {
    const capability = createCapability({})
    const requests = await capability.getSegmentRequests({
      collectionSlug: 'videos',
      expiresIn: 900,
      mimeType: 'video/mp4',
      object,
      providerState: { contentType: 'video/mp4' },
      req,
      segments: [
        { end: 5, number: 1, start: 0 },
        { end: 10, number: 12, start: 5 },
      ],
    })

    const urls = requests.map(({ url }) => new URL(url))

    expect(urls.map((url) => url.pathname)).toEqual([
      `/media/${stagingPath}`,
      `/media/${stagingPath}`,
    ])
    expect(urls.map((url) => url.searchParams.get('comp'))).toEqual(['block', 'block'])
    expect(urls.map((url) => url.searchParams.get('blockid'))).toEqual([blockID(1), blockID(12)])
    expect(urls.map((url) => url.searchParams.get('sp'))).toEqual(['w', 'w'])
  })

  it('should report staged blocks and ignore blocks it did not create', async () => {
    const capability = createCapability({
      staging: {
        getBlockList: vi.fn().mockResolvedValue({
          committedBlocks: [{ name: blockID(1), size: 5 }],
          uncommittedBlocks: [
            { name: blockID(2), size: 5 },
            { name: Buffer.from('foreign').toString('base64'), size: 1 },
          ],
        }),
      },
    })

    await expect(capability.reconcile({ object, providerState: {}, req })).resolves.toEqual([
      { number: 1, size: 5 },
      { number: 2, size: 5 },
    ])
  })

  it('should read the copied blocks once the staging blob is gone', async () => {
    const capability = createCapability({
      final: {
        getBlockList: vi
          .fn()
          .mockResolvedValue({ committedBlocks: [{ name: blockID(1), size: 5 }] }),
      },
      staging: { getBlockList: vi.fn().mockRejectedValue(restError(404)) },
    })

    await expect(capability.reconcile({ object, providerState: {}, req })).resolves.toEqual([
      { number: 1, size: 5 },
    ])
  })

  it('should report no blocks before the first one is staged', async () => {
    const capability = createCapability({
      final: { getBlockList: vi.fn().mockRejectedValue(restError(404)) },
      staging: { getBlockList: vi.fn().mockRejectedValue(restError(404)) },
    })

    await expect(capability.reconcile({ object, providerState: {}, req })).resolves.toEqual([])
  })

  it('should commit the staging blob in order, copy it create-only, then remove it', async () => {
    const commitBlockList = vi.fn().mockResolvedValue({})
    const stagingDelete = vi.fn().mockResolvedValue({})
    const beginCopyFromURL = vi
      .fn()
      .mockResolvedValue({ pollUntilDone: () => Promise.resolve({ copyStatus: 'success' }) })
    const getProperties = vi
      .fn()
      .mockRejectedValueOnce(restError(404))
      .mockResolvedValue({ contentLength: 10 })

    const capability = createCapability({
      final: { beginCopyFromURL, getProperties },
      staging: { commitBlockList, deleteIfExists: stagingDelete },
    })

    const result = await capability.complete({
      object,
      providerState: { contentType: 'video/mp4' },
      req,
      segments: [
        { number: 2, size: 5 },
        { number: 1, size: 5 },
      ],
    })

    expect(result).toEqual({ size: 10 })
    expect(commitBlockList).toHaveBeenCalledWith([blockID(1), blockID(2)], {
      blobHTTPHeaders: { blobContentType: 'video/mp4' },
      conditions: { ifNoneMatch: '*' },
    })
    expect(beginCopyFromURL).toHaveBeenCalledWith(expect.stringContaining(stagingPath), {
      conditions: { ifNoneMatch: '*' },
    })
    expect(stagingDelete).toHaveBeenCalled()
  })

  it('should finish a retried completion whose copy already happened', async () => {
    const beginCopyFromURL = vi.fn()
    const stagingDelete = vi.fn().mockResolvedValue({})
    const capability = createCapability({
      final: { beginCopyFromURL, getProperties: vi.fn().mockResolvedValue({ contentLength: 10 }) },
      staging: { deleteIfExists: stagingDelete },
    })

    const result = await capability.complete({
      object,
      providerState: { contentType: 'video/mp4' },
      req,
      segments: [{ number: 1, size: 10 }],
    })

    expect(result).toEqual({ size: 10 })
    expect(beginCopyFromURL).not.toHaveBeenCalled()
    expect(stagingDelete).toHaveBeenCalled()
  })

  it('should discard staged blocks and delete an orphaned final blob when aborting', async () => {
    const stagingDelete = vi.fn().mockResolvedValue({})
    const finalDelete = vi.fn().mockResolvedValue({})
    const capability = createCapability({
      final: { deleteIfExists: finalDelete },
      staging: {
        commitBlockList: vi.fn().mockRejectedValue(restError(409)),
        deleteIfExists: stagingDelete,
      },
    })

    await capability.abort({ object, providerState: {}, req })

    expect(stagingDelete).toHaveBeenCalled()
    expect(finalDelete).toHaveBeenCalled()
  })
})
