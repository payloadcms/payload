import type { PayloadRequest, SanitizedCollectionConfig } from 'payload'

import { describe, expect, it, vi } from 'vitest'

import { getPreviewThumbnailURLs } from './getPreviewThumbnailURLs.js'

function createArgs({ relationTo = 'media' }: { relationTo?: string | string[] } = {}) {
  const collection = {
    admin: { useAsThumbnail: 'cover' },
    flattenedFields: [{ name: 'cover', type: 'upload', relationTo }],
  } as unknown as SanitizedCollectionConfig
  const find = vi.fn().mockResolvedValue({ docs: [] })
  const req = {
    payload: {
      collections: {
        media: { config: { upload: {}, flattenedFields: [] } },
        images: { config: { upload: {}, flattenedFields: [] } },
      },
      find,
      logger: { error: vi.fn() },
    },
    user: { id: 'user-1' },
  } as unknown as PayloadRequest

  return { collection, find, req }
}

describe('collection preview thumbnails', () => {
  it('should deduplicate uploads and use only the first has-many thumbnail', async () => {
    const { collection, find, req } = createArgs()
    const docs = [
      { id: '1', cover: ['shared', 'unused'] },
      { id: '2', cover: 'shared' },
      { id: '3', cover: [] },
    ]

    find.mockResolvedValue({ docs: [{ id: 'shared', mimeType: 'image/png', url: '/shared.png' }] })

    const result = await getPreviewThumbnailURLs({ collection, docs, req })

    expect(find).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({
        collection: 'media',
        limit: 1,
        pagination: false,
        select: expect.objectContaining({ url: true }),
        where: { id: { in: ['shared'] } },
      }),
    )
    expect([...result.values()]).toEqual(['/shared.png', '/shared.png', undefined])
    expect(docs[0].cover).toEqual(['shared', 'unused'])
  })

  it('should group polymorphic thumbnails by collection and retain numeric zero IDs', async () => {
    const { collection, find, req } = createArgs({ relationTo: ['media', 'images'] })

    find.mockImplementation(async ({ collection }) => ({
      docs: [{ id: 0, mimeType: 'image/png', url: `/${collection}.png` }],
    }))

    const result = await getPreviewThumbnailURLs({
      collection,
      docs: [
        { id: '1', cover: { relationTo: 'media', value: 0 } },
        { id: '2', cover: [{ relationTo: 'images', value: 0 }] },
        { id: '3', cover: { relationTo: 'users', value: 'private' } },
      ],
      req,
    })

    expect(find).toHaveBeenCalledTimes(2)
    expect(find).toHaveBeenCalledWith(
      expect.objectContaining({ collection: 'media', where: { id: { in: [0] } } }),
    )
    expect([...result.values()]).toEqual(['/media.png', '/images.png', undefined])
  })

  it('should leave missing or unreadable thumbnails as placeholders', async () => {
    const { collection, req } = createArgs()
    const result = await getPreviewThumbnailURLs({
      collection,
      docs: [{ id: '1', cover: 'denied' }],
      req,
    })

    expect(result.get('1')).toBeUndefined()
  })

  it('should preserve accessible thumbnails when another upload collection fails', async () => {
    const { collection, find, req } = createArgs({ relationTo: ['media', 'images'] })

    find.mockRejectedValueOnce(new Error('Forbidden')).mockResolvedValueOnce({
      docs: [{ id: 'image', mimeType: 'image/png', url: '/image.png' }],
    })

    const result = await getPreviewThumbnailURLs({
      collection,
      docs: [
        { id: '1', cover: { relationTo: 'media', value: 'denied' } },
        { id: '2', cover: { relationTo: 'images', value: 'image' } },
      ],
      req,
    })

    expect([...result.values()]).toEqual([undefined, '/image.png'])
    expect(req.payload.logger.error).toHaveBeenCalledOnce()
  })

  it('should use upload documents directly without extra queries', async () => {
    const { collection, find, req } = createArgs()

    collection.admin = {}
    collection.upload = {} as SanitizedCollectionConfig['upload']

    const result = await getPreviewThumbnailURLs({
      collection,
      docs: [{ id: '1', mimeType: 'image/png', url: '/upload.png' }],
      req,
    })

    expect(result.get('1')).toBe('/upload.png')
    expect(find).not.toHaveBeenCalled()
  })

  it('should skip queries for empty or malformed thumbnail references', async () => {
    const { collection, find, req } = createArgs()

    await getPreviewThumbnailURLs({
      collection,
      docs: [{ id: '1' }, { id: '2', cover: [] }, { id: '3', cover: {} }],
      req,
    })

    expect(find).not.toHaveBeenCalled()
  })
})
