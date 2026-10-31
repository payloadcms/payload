import type { PayloadRequest } from 'payload'

import { beforeEach, describe, expect, it, vi } from 'vitest'

import { createClientUploadReceipt, getSafeFileName } from 'payload/internal'

import { resolveSignedURLKey } from './resolveSignedURLKey.js'

vi.mock('payload/internal', () => ({
  createClientUploadReceipt: vi.fn(() => 'receipt'),
  getSafeFileName: vi.fn(),
}))

describe('resolveSignedURLKey', () => {
  const req = { payload: { collections: {} } } as unknown as PayloadRequest

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should deduplicate within the resolved document prefix', async () => {
    vi.mocked(getSafeFileName).mockImplementation(async ({ desiredFilename }) => {
      expect(desiredFilename).toBe('photo.jpg')
      return 'photo-1.jpg'
    })

    const result = await resolveSignedURLKey({
      collectionPrefix: 'media',
      collectionSlug: 'media',
      docPrefix: 'media-archive',
      filename: 'photo.jpg',
      req,
    })

    expect(result.sanitizedDocPrefix).toBe('media/media-archive')
    expect(result.fileKey).toMatch(/^media\/media-archive\/[0-9a-f-]+\/photo-1\.jpg$/)
    expect(result.sanitizedFilename).toBe('photo-1.jpg')
    expect(result._objectKey).toMatch(/^[0-9a-f-]+$/)
    expect(result.clientUploadContext).toMatchObject({
      _objectKey: result._objectKey,
      prefix: 'media/media-archive',
      signedReceipt: 'receipt',
    })
  })

  it('should mint the receipt for a prefix contained by the collection prefix', async () => {
    vi.mocked(getSafeFileName).mockResolvedValue('photo-1.jpg')

    const { _objectKey, sanitizedDocPrefix } = await resolveSignedURLKey({
      collectionPrefix: 'media',
      collectionSlug: 'media',
      docPrefix: 'media-archive',
      filename: 'photo.jpg',
      req,
    })

    expect(sanitizedDocPrefix).toBe('media/media-archive')
    expect(createClientUploadReceipt).toHaveBeenCalledWith({
      collectionSlug: 'media',
      context: { _objectKey, prefix: sanitizedDocPrefix },
      filename: 'photo-1.jpg',
      req,
    })
  })

  it('should check collisions within the prefix when filename is unique per prefix', async () => {
    vi.mocked(getSafeFileName).mockResolvedValue('logo.png')

    const reqWithCompoundIndex = {
      payload: {
        collections: {
          media: { config: { upload: { filenameCompoundIndex: ['filename', 'prefix'] } } },
        },
      },
    } as unknown as PayloadRequest

    await resolveSignedURLKey({
      collectionPrefix: 'media',
      collectionSlug: 'media',
      docPrefix: 'site-b',
      filename: 'logo.png',
      req: reqWithCompoundIndex,
    })

    expect(getSafeFileName).toHaveBeenCalledWith({
      collectionSlug: 'media',
      desiredFilename: 'logo.png',
      prefix: 'media/site-b',
      req: reqWithCompoundIndex,
    })
  })

  it('should check collisions globally when filename is not unique per prefix', async () => {
    vi.mocked(getSafeFileName).mockResolvedValue('logo.png')

    const reqWithoutCompoundIndex = {
      payload: {
        collections: {
          media: { config: { upload: {} } },
        },
      },
    } as unknown as PayloadRequest

    await resolveSignedURLKey({
      collectionPrefix: 'media',
      collectionSlug: 'media',
      docPrefix: 'site-b',
      filename: 'logo.png',
      req: reqWithoutCompoundIndex,
    })

    expect(getSafeFileName).toHaveBeenCalledWith({
      collectionSlug: 'media',
      desiredFilename: 'logo.png',
      prefix: undefined,
      req: reqWithoutCompoundIndex,
    })
  })
})
