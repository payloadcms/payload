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

    it('should update every matching document even when updates shrink the result set', async () => {
      // Models real database behavior: each update removes the deleted id from
      // the document, so the document leaves the find result set. Advancing
      // `page` while updating would skip documents that shift forward into
      // already-visited pages (with 150 matches and limit 100, the old
      // page-while-updating loop only updated 100).
      const docs = Array.from({ length: 150 }, (_, i) => ({
        id: `post-${i}`,
        _h_tags: ['tag-sport'],
      }))
      const find = vi.fn().mockImplementation(
        async ({ page, limit }: { page: number; limit: number }) => {
          const pageDocs = docs.slice((page - 1) * limit, page * limit)
          return { docs: pageDocs, hasNextPage: page * limit < docs.length }
        },
      )
      const update = vi.fn().mockImplementation(async ({ id }: { id: string }) => {
        const index = docs.findIndex((doc) => doc.id === id)
        if (index !== -1) {
          docs.splice(index, 1)
        }
        return {}
      })
      const req = { payload: { find, update } }

      const hook = hierarchyCollectionAfterDelete({
        relatedCollections: { posts: { fieldName: '_h_tags', hasMany: true } },
      })

      await hook({ id: 'tag-sport', req: req as any })

      expect(update).toHaveBeenCalledTimes(150)
      const updatedIds = new Set(
        update.mock.calls.map((call) => (call[0] as { id: string }).id),
      )
      expect(updatedIds.size).toBe(150)
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

    it('should sweep every locale for localized fields', async () => {
      const find = vi.fn().mockImplementation(async ({ locale }: { locale?: string }) => ({
        docs:
          locale === 'en'
            ? [{ id: 'post-1', _h_tags: ['tag-sport', 'tag-news'] }]
            : [{ id: 'post-1', _h_tags: ['tag-sport'] }],
        hasNextPage: false,
      }))
      const update = vi.fn().mockResolvedValue({})
      const req = {
        payload: {
          collections: {
            posts: {
              config: {
                fields: [{ name: '_h_tags', type: 'relationship', localized: true }],
              },
            },
          },
          config: { localization: { localeCodes: ['en', 'es'] } },
          find,
          update,
        },
      }

      const hook = hierarchyCollectionAfterDelete({
        relatedCollections: { posts: { fieldName: '_h_tags', hasMany: true } },
      })

      await hook({ id: 'tag-sport', req: req as any })

      expect(find).toHaveBeenCalledTimes(2)
      expect(find).toHaveBeenCalledWith(expect.objectContaining({ locale: 'en' }))
      expect(find).toHaveBeenCalledWith(expect.objectContaining({ locale: 'es' }))
      expect(update).toHaveBeenCalledTimes(2)
      expect(update).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'post-1',
          locale: 'en',
          data: { _h_tags: ['tag-news'] },
        }),
      )
      expect(update).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'post-1',
          locale: 'es',
          data: { _h_tags: [] },
        }),
      )
    })

    it('should not repeat passes for non-localized fields when localization is enabled', async () => {
      const find = vi.fn().mockResolvedValue({
        docs: [{ id: 'post-1', _h_tags: ['tag-sport'] }],
        hasNextPage: false,
      })
      const update = vi.fn().mockResolvedValue({})
      const req = {
        payload: {
          collections: {
            posts: {
              config: {
                fields: [{ name: '_h_tags', type: 'relationship' }],
              },
            },
          },
          config: { localization: { localeCodes: ['en', 'es'] } },
          find,
          update,
        },
      }

      const hook = hierarchyCollectionAfterDelete({
        relatedCollections: { posts: { fieldName: '_h_tags', hasMany: true } },
      })

      await hook({ id: 'tag-sport', req: req as any })

      expect(find).toHaveBeenCalledTimes(1)
      expect(find.mock.calls[0][0]).not.toHaveProperty('locale')
      expect(update).toHaveBeenCalledTimes(1)
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
