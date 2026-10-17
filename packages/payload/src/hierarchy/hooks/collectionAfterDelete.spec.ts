import { describe, expect, it, vi } from 'vitest'

import { hierarchyCollectionAfterDelete } from './collectionAfterDelete.js'

const buildReq = (findResult: { docs: any[]; hasNextPage: boolean }) => {
  const find = vi.fn().mockResolvedValue(findResult)
  const update = vi.fn().mockResolvedValue({})
  return {
    find,
    req: { payload: { find, update } },
    update,
  }
}

describe('hierarchyCollectionAfterDelete', () => {
  describe('multi-value (hasMany) fields', () => {
    it('should remove only the deleted id from each document, keeping the other values', async () => {
      const { req, update } = buildReq({
        docs: [
          { id: 'post-1', _h_tags: ['tag-sport', 'tag-news'] },
          { id: 'post-2', _h_tags: ['tag-sport'] },
        ],
        hasNextPage: false,
      })

      const hook = hierarchyCollectionAfterDelete({
        relatedCollections: { posts: { fieldName: '_h_tags', hasMany: true } },
      })

      await hook({ id: 'tag-sport', req: req as any })

      expect(update).toHaveBeenCalledTimes(2)
      expect(update).toHaveBeenCalledWith(
        expect.objectContaining({
          collection: 'posts',
          data: { _h_tags: ['tag-news'] },
          id: 'post-1',
        }),
      )
      expect(update).toHaveBeenCalledWith(
        expect.objectContaining({
          collection: 'posts',
          data: { _h_tags: [] },
          id: 'post-2',
        }),
      )
    })

    it('should page through all matching documents', async () => {
      const { req, update } = buildReq({
        docs: [{ id: 'post-1', _h_tags: ['tag-sport'] }],
        hasNextPage: true,
      })
      // Second page is empty with no more pages
      const findMock = (req.payload as any).find as ReturnType<typeof vi.fn>
      findMock
        .mockResolvedValueOnce({
          docs: [{ id: 'post-1', _h_tags: ['tag-sport'] }],
          hasNextPage: true,
        })
        .mockResolvedValueOnce({ docs: [], hasNextPage: false })

      const hook = hierarchyCollectionAfterDelete({
        relatedCollections: { posts: { fieldName: '_h_tags', hasMany: true } },
      })

      await hook({ id: 'tag-sport', req: req as any })

      expect(findMock).toHaveBeenCalledTimes(2)
      expect(findMock.mock.calls[1][0]).toMatchObject({ page: 2 })
      expect(update).toHaveBeenCalledTimes(1)
    })

    it('should remove the id from localized values per locale', async () => {
      const { req, update } = buildReq({
        docs: [{ id: 'post-1', _h_tags: { en: ['tag-sport', 'tag-news'], es: ['tag-sport'] } }],
        hasNextPage: false,
      })

      const hook = hierarchyCollectionAfterDelete({
        relatedCollections: { posts: { fieldName: '_h_tags', hasMany: true } },
      })

      await hook({ id: 'tag-sport', req: req as any })

      expect(update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { _h_tags: { en: ['tag-news'], es: [] } },
        }),
      )
    })

    it('should match populated document values by their id', async () => {
      const { req, update } = buildReq({
        docs: [{ id: 'post-1', _h_tags: [{ id: 'tag-sport' }, { id: 'tag-news' }] }],
        hasNextPage: false,
      })

      const hook = hierarchyCollectionAfterDelete({
        relatedCollections: { posts: { fieldName: '_h_tags', hasMany: true } },
      })

      await hook({ id: 'tag-sport', req: req as any })

      expect(update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { _h_tags: [{ id: 'tag-news' }] },
        }),
      )
    })
  })

  describe('single-value fields', () => {
    it('should keep clearing the whole field to null', async () => {
      const { req, update } = buildReq({ docs: [], hasNextPage: false })

      const hook = hierarchyCollectionAfterDelete({
        relatedCollections: { posts: { fieldName: '_h_folder', hasMany: false } },
      })

      await hook({ id: 'folder-1', req: req as any })

      expect(update).toHaveBeenCalledTimes(1)
      expect(update).toHaveBeenCalledWith(
        expect.objectContaining({
          collection: 'posts',
          data: { _h_folder: null },
          where: { _h_folder: { equals: 'folder-1' } },
        }),
      )
    })
  })
})
