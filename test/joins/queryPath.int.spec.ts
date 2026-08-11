// @ts-expect-error -- payload-types are not generated for this ad-hoc config
import { type MongooseAdapter } from '@payloadcms/db-mongodb'
import { buildConfig, getPayload } from 'payload'
import { afterEach, expect, it, vi } from 'vitest'

import { describe } from '../__helpers/int/vitest.js'

describe(
  'mongodb read path selection',
  { db: (adapter) => adapter === 'mongodb' || adapter === 'mongodb-atlas' },
  () => {
    const createdIDs: (number | string)[] = []

    const getPayloadInstance = async () =>
      await getPayload({
        key: '_joinsQueryPath',
        config: await buildConfig({
          secret: '______',
          db: await import('../databaseAdapter.js').then((mod) => mod.databaseAdapter),
          collections: [
            {
              slug: 'categories',
              fields: [
                { name: 'title', type: 'text' },
                {
                  name: 'posts',
                  type: 'join',
                  collection: 'posts',
                  on: 'category',
                },
              ],
              versions: false,
            },
            {
              slug: 'posts',
              fields: [
                {
                  name: 'category',
                  type: 'relationship',
                  relationTo: 'categories',
                },
              ],
              versions: false,
            },
          ],
        }),
      })

    const seedCategory = async () => {
      const payload = await getPayloadInstance()

      const category = await payload.create({
        collection: 'categories',
        data: { title: 'a' },
      })
      createdIDs.push(category.id)

      return {
        adapter: payload.db as unknown as MongooseAdapter,
        category,
        payload,
      }
    }

    afterEach(async () => {
      vi.restoreAllMocks()

      const payload = await getPayloadInstance()

      for (const id of createdIDs) {
        await payload.delete({ collection: 'categories', id })
      }

      createdIDs.length = 0
    })

    it('should use Model.paginate when a select excludes every join field', async () => {
      const { adapter, payload } = await seedCategory()
      const Model = adapter.collections.categories

      const aggregateSpy = vi.spyOn(Model, 'aggregate')
      const paginateSpy = vi.spyOn(Model, 'paginate')

      await payload.find({
        collection: 'categories',
        limit: 20,
        select: { title: true },
        where: { title: { equals: 'a' } },
      })

      expect(aggregateSpy).not.toHaveBeenCalled()
      expect(paginateSpy).toHaveBeenCalledTimes(1)
    })

    it('should use Model.paginate when every join is disabled individually', async () => {
      const { adapter, payload } = await seedCategory()
      const Model = adapter.collections.categories

      const aggregateSpy = vi.spyOn(Model, 'aggregate')
      const paginateSpy = vi.spyOn(Model, 'paginate')

      await payload.find({
        collection: 'categories',
        joins: { posts: false },
        limit: 20,
        where: { title: { equals: 'a' } },
      })

      expect(aggregateSpy).not.toHaveBeenCalled()
      expect(paginateSpy).toHaveBeenCalledTimes(1)
    })

    it('should use Model.findOne for findByID when a select excludes every join field', async () => {
      const { adapter, category, payload } = await seedCategory()
      const Model = adapter.collections.categories

      const aggregateSpy = vi.spyOn(Model, 'aggregate')
      const findOneSpy = vi.spyOn(Model, 'findOne')

      await payload.findByID({
        collection: 'categories',
        id: category.id,
        select: { title: true },
      })

      expect(aggregateSpy).not.toHaveBeenCalled()
      expect(findOneSpy).toHaveBeenCalledTimes(1)
    })

    it('should still use Model.aggregate when a join field is actually selected', async () => {
      const { adapter, payload } = await seedCategory()
      const Model = adapter.collections.categories

      const aggregateSpy = vi.spyOn(Model, 'aggregate')
      const paginateSpy = vi.spyOn(Model, 'paginate')

      await payload.find({
        collection: 'categories',
        limit: 20,
        where: { title: { equals: 'a' } },
      })

      expect(aggregateSpy).toHaveBeenCalledTimes(1)
      expect(paginateSpy).not.toHaveBeenCalled()
    })
  },
)
