import type { Access } from 'payload'

import { expect, vi } from 'vitest'

import { test } from '../__helpers/int/vitest.js'
import { nativeBranchDatabaseOptions } from './adapterCapabilities.js'
import { queryDocsSlug, scalarArticlesSlug } from './slugs.js'

test.suite(
  'Local update numeric zero ID',
  { config: './config.ts', ...nativeBranchDatabaseOptions },
  () => {
    test('should update only the document with numeric ID zero', async ({ payload }) => {
      const neighbor = await payload.create({
        collection: queryDocsSlug,
        data: { id: 1, title: 'Unchanged neighbor' },
        depth: 0,
      })
      const created = await payload.create({
        collection: queryDocsSlug,
        data: { id: 0, title: 'Original zero' },
        depth: 0,
      })

      expect(created.id).toBe(0)

      const config = payload.collections[queryDocsSlug]!.config
      const previousUpdateAccess = config.access.update
      const updateAccess = vi.fn<Access>(() => true)

      config.access.update = updateAccess

      let updated

      try {
        updated = await payload.update({
          collection: queryDocsSlug,
          id: 0,
          data: { title: 'Updated zero' },
          depth: 0,
          overrideAccess: false,
        })
      } finally {
        config.access.update = previousUpdateAccess
      }

      expect(updateAccess).toHaveBeenCalledTimes(1)
      expect(updateAccess.mock.calls[0]?.[0]).toMatchObject({ id: 0 })

      const persisted = await payload.findByID({
        collection: queryDocsSlug,
        id: 0,
        depth: 0,
        joins: false,
      })
      const unchanged = await payload.findByID({
        collection: queryDocsSlug,
        id: neighbor.id,
        depth: 0,
        joins: false,
      })

      expect(updated).toMatchObject({ id: 0, title: 'Updated zero' })
      expect(updated).not.toHaveProperty('docs')
      expect(persisted).toMatchObject({ id: 0, title: 'Updated zero' })
      expect(unchanged).toMatchObject({ id: 1, title: 'Unchanged neighbor' })
    })

    test('should retain bulk updates when no ID is supplied', async ({ payload }) => {
      const neighbor = await payload.create({
        collection: scalarArticlesSlug,
        data: { title: 'Unchanged neighbor' },
      })
      const target = await payload.create({
        collection: scalarArticlesSlug,
        data: { title: 'Original target' },
      })

      const updated = await payload.update({
        collection: scalarArticlesSlug,
        where: { id: { equals: target.id } },
        data: { title: 'Bulk target' },
      })
      const unchanged = await payload.findByID({
        collection: scalarArticlesSlug,
        id: neighbor.id,
      })

      expect(updated.errors).toHaveLength(0)
      expect(updated.docs).toMatchObject([{ id: target.id, title: 'Bulk target' }])
      expect(unchanged).toMatchObject({ id: neighbor.id, title: 'Unchanged neighbor' })
    })

    test.options(
      'should update numeric ID zero selected by a relationship predicate',
      { db: 'drizzle' },
      async ({ payload }) => {
        const target = await payload.create({
          collection: queryDocsSlug,
          data: { id: 2, title: 'Relationship target' },
          depth: 0,
        })

        await payload.create({
          collection: queryDocsSlug,
          data: { id: 1, rank: 1 },
          depth: 0,
        })
        await payload.create({
          collection: queryDocsSlug,
          data: { id: 0, rank: 0, one: target.id },
          depth: 0,
        })

        const updated = await payload.db.updateOne({
          collection: queryDocsSlug,
          data: { rank: 42 },
          joins: false,
          locale: 'en',
          where: { 'one.title': { equals: 'Relationship target' } },
        })
        const unchanged = await payload.findByID({
          collection: queryDocsSlug,
          id: 1,
          depth: 0,
          joins: false,
        })

        expect(updated).toMatchObject({ id: 0, rank: 42 })
        expect(unchanged).toMatchObject({ id: 1, rank: 1 })
      },
    )

    test('should reject an update without an ID or where selector', async ({ payload }) => {
      await expect(
        // @ts-expect-error -- Exercise the missing-selector runtime validation.
        payload.update({ collection: queryDocsSlug, data: { title: 'Missing selector' } }),
      ).rejects.toThrow("Missing 'where' query of documents to update.")
    })
  },
)
