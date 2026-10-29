import { createClientUploadReceipt, getSafeFileName } from 'payload/internal'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { resolveSignedURLKey } from './resolveSignedURLKey.js'

vi.mock('payload/internal', async () => {
  const { incrementName } = await import('../../../payload/src/uploads/getSafeFilename.js')
  const { getOriginalFilename } =
    await import('../../../payload/src/uploads/fileVersioning/naming.js')
  const { truncateFilename } = await import('../../../payload/src/uploads/truncateFilename.js')

  return {
    createClientUploadReceipt: vi.fn(() => 'receipt'),
    getOriginalFilename,
    getSafeFileName: vi.fn(async ({ desiredFilename }) => desiredFilename),
    incrementName,
    truncateFilename,
  }
})

describe('resolveSignedURLKey', () => {
  it('should resolve a collision when the numeric suffix cannot safely increment', async () => {
    vi.mocked(getSafeFileName).mockImplementation(async ({ desiredFilename }) =>
      desiredFilename === 'x-9007199254740992-original'
        ? 'x-9007199254740992-original-1'
        : desiredFilename,
    )

    const result = await resolveSignedURLKey({
      collectionSlug: 'media',
      filename: 'x-9007199254740992',
      req: {} as never,
    })

    expect(result.sanitizedFilename).toBe('x-9007199254740992-1')
    expect(getSafeFileName).toHaveBeenCalledTimes(2)
  })

  it.each(['', '.jpg'])(
    'should reserve bytes for original and collision suffixes with extension %s',
    async (extension) => {
      vi.mocked(getSafeFileName).mockResolvedValueOnce('conflict')

      const result = await resolveSignedURLKey({
        collectionSlug: 'media',
        filename: `${'é'.repeat(127)}${extension}`,
        req: {} as never,
      })

      expect(result.sanitizedFilename.endsWith(`-1${extension}`)).toBe(true)
      for (const [args] of vi.mocked(getSafeFileName).mock.calls) {
        expect(Buffer.byteLength(args.desiredFilename)).toBeLessThanOrEqual(255)
        expect(args.desiredFilename.endsWith(`-original${extension}`)).toBe(true)
      }
      expect(getSafeFileName).toHaveBeenCalledTimes(2)
    },
  )

  it('should stop retrying persistent collisions', async () => {
    vi.mocked(getSafeFileName).mockResolvedValue('conflict')

    await expect(
      resolveSignedURLKey({
        collectionSlug: 'media',
        filename: 'photo.jpg',
        req: {} as never,
      }),
    ).rejects.toThrow('Unable to find an available upload filename')
    expect(getSafeFileName).toHaveBeenCalledTimes(1000)
  })

  beforeEach(() => {
    vi.mocked(getSafeFileName).mockReset()
    vi.mocked(getSafeFileName).mockImplementation(async ({ desiredFilename }) => desiredFilename)
    vi.mocked(createClientUploadReceipt).mockClear()
  })

  it('checks the normalized filename before resolving the storage key', async () => {
    vi.mocked(getSafeFileName).mockResolvedValueOnce('photo-original-1.png')

    const result = await resolveSignedURLKey({
      collectionPrefix: 'media',
      collectionSlug: 'uploads',
      filename: 'nested\\folder/photo.png',
      req: {} as never,
    })

    expect(getSafeFileName).toHaveBeenCalledWith({
      collectionSlug: 'uploads',
      desiredFilename: 'photo-original.png',
      req: {},
    })
    expect(createClientUploadReceipt).toHaveBeenCalledWith({
      _objectKey: expect.stringMatching(/^[0-9a-f-]+$/),
      collectionSlug: 'uploads',
      filePrefix: 'media',
      filename: 'photo-1.png',
      req: {},
      storageFilePath: expect.stringMatching(/^media\/[0-9a-f-]+\/photo-1-original\.png$/),
    })
    expect(result).toEqual({
      sanitizedDocPrefix: 'media',
      sanitizedFilename: 'photo-1.png',
      storageFilePath: expect.stringMatching(/^media\/[0-9a-f-]+\/photo-1-original\.png$/),
      uploadReference: {
        _objectKey: expect.stringMatching(/^[0-9a-f-]+$/),
        prefix: 'media',
        signedReceipt: 'receipt',
      },
    })
  })

  it('should mint the receipt for a key contained by the collection prefix', async () => {
    vi.mocked(getSafeFileName).mockResolvedValueOnce('photo-original-1.jpg')

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
      storageFilePath: expect.stringMatching(
        /^media\/media-archive\/[0-9a-f-]+\/photo-1-original\.jpg$/,
      ),
      uploadReference: {
        _objectKey: expect.stringMatching(/^[0-9a-f-]+$/),
        prefix: 'media/media-archive',
        signedReceipt: 'receipt',
      },
    })
  })

  it('should sign adapterData into the receipt', async () => {
    await resolveSignedURLKey({
      adapterData: { providerUploadID: 'provider-1' },
      collectionSlug: 'media',
      filename: 'photo.jpg',
      req: {} as never,
    })

    expect(createClientUploadReceipt).toHaveBeenCalledWith(
      expect.objectContaining({ adapterData: { providerUploadID: 'provider-1' } }),
    )
  })
})
