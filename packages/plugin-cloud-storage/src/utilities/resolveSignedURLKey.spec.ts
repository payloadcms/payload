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
      fileKey: expect.stringMatching(/^media\/[0-9a-f-]+\/photo-1\.png$/),
      filePrefix: 'media',
      filename: 'photo-1.png',
      req: {},
    })
    expect(result).toEqual({
      fileKey: expect.stringMatching(/^media\/[0-9a-f-]+\/photo-1\.png$/),
      sanitizedDocPrefix: 'media',
      sanitizedFilename: 'photo-1.png',
      uploadReference: {
        _objectKey: expect.stringMatching(/^[0-9a-f-]+$/),
        prefix: 'media',
        signedReceipt: 'receipt',
      },
    })
  })
})
