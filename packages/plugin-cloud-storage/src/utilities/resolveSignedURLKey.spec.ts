import { createClientUploadReceipt, getSafeFileName } from 'payload/internal'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { resolveSignedURLKey } from './resolveSignedURLKey.js'

vi.mock('payload/internal', () => ({
  createClientUploadReceipt: vi.fn(() => 'receipt'),
  getSafeFileName: vi.fn(async ({ desiredFilename }) => desiredFilename),
}))

describe('resolveSignedURLKey', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('checks the normalized filename before resolving the storage key', async () => {
    vi.mocked(getSafeFileName).mockResolvedValueOnce('photo-1.png')

    const result = await resolveSignedURLKey({
      collectionPrefix: 'media',
      collectionSlug: 'uploads',
      filename: 'nested\\folder/photo.png',
      req: {} as never,
    })

    expect(getSafeFileName).toHaveBeenCalledWith({
      collectionSlug: 'uploads',
      desiredFilename: 'photo.png',
      req: {},
    })
    expect(createClientUploadReceipt).toHaveBeenCalledWith({
      _objectKey: expect.stringMatching(/^[0-9a-f-]+$/),
      collectionSlug: 'uploads',
      filePrefix: 'media',
      filename: 'photo-1.png',
      req: {},
      storageFilePath: expect.stringMatching(/^media\/[0-9a-f-]+\/photo-1\.png$/),
    })
    expect(result).toEqual({
      sanitizedDocPrefix: 'media',
      sanitizedFilename: 'photo-1.png',
      storageFilePath: expect.stringMatching(/^media\/[0-9a-f-]+\/photo-1\.png$/),
      uploadReference: {
        _objectKey: expect.stringMatching(/^[0-9a-f-]+$/),
        prefix: 'media',
        signedReceipt: 'receipt',
      },
    })
  })

  it('should mint the receipt for a key contained by the collection prefix', async () => {
    vi.mocked(getSafeFileName).mockResolvedValueOnce('photo-1.jpg')

    const result = await resolveSignedURLKey({
      collectionPrefix: 'media',
      collectionSlug: 'media',
      docPrefix: 'media-archive',
      filename: 'photo.jpg',
      req: {} as never,
    })

    expect(createClientUploadReceipt).toHaveBeenCalledWith({
      _objectKey: expect.stringMatching(/^[0-9a-f-]+$/),
      collectionSlug: 'media',
      filePrefix: result.sanitizedDocPrefix,
      filename: 'photo-1.jpg',
      req: {},
      storageFilePath: result.storageFilePath,
    })
    expect(result).toEqual({
      sanitizedDocPrefix: 'media/media-archive',
      sanitizedFilename: 'photo-1.jpg',
      storageFilePath: expect.stringMatching(/^media\/media-archive\/[0-9a-f-]+\/photo-1\.jpg$/),
      uploadReference: {
        _objectKey: expect.stringMatching(/^[0-9a-f-]+$/),
        prefix: 'media/media-archive',
        signedReceipt: 'receipt',
      },
    })
  })
})
