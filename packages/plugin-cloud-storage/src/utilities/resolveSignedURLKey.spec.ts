import { getSafeFileName } from 'payload/internal'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { resolveSignedURLKey } from './resolveSignedURLKey.js'

vi.mock('payload/internal', () => ({
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
      filename: 'nested/photo.png',
      req: {} as never,
    })

    expect(getSafeFileName).toHaveBeenCalledWith({
      collectionSlug: 'uploads',
      desiredFilename: 'photo.png',
      req: {},
    })
    expect(result).toEqual({
      fileKey: 'media/photo-1.png',
      sanitizedDocPrefix: '',
      sanitizedFilename: 'photo-1.png',
    })
  })
})
