import { expect } from 'vitest'

import { test } from '../__helpers/int/vitest.js'
import {
  mongoJoinArticlesSlug,
  mongoJoinNotesSlug,
  mongoJoinParentsSlug,
} from './collections/MongoPolymorphicAggregation.js'

test.suite(
  'MongoDB polymorphic join aggregation',
  { config: './aggregation.config.ts', db: 'mongo' },
  () => {
    test('should filter each target before counting and paging a mixed join', async ({
      payload,
    }) => {
      const user = await payload.create({
        collection: 'users',
        data: { email: 'reader@example.com', password: 'password' },
        overrideAccess: true,
      })
      const parent = await payload.create({
        collection: mongoJoinParentsSlug,
        data: {},
        overrideAccess: true,
      })
      const otherParent = await payload.create({
        collection: mongoJoinParentsSlug,
        data: {},
        overrideAccess: true,
      })
      const articleA = await payload.create({
        collection: mongoJoinArticlesSlug,
        data: { articleScope: 'shared', parent: parent.id, title: 'A', variant: ['pub'] },
        overrideAccess: true,
      })
      const noteB = await payload.create({
        collection: mongoJoinNotesSlug,
        data: {
          isVisible: true,
          parent: [parent.id, otherParent.id],
          title: 'B',
          variant: 'public',
        },
        overrideAccess: true,
      })
      const articleC = await payload.create({
        collection: mongoJoinArticlesSlug,
        data: { articleScope: 'shared', parent: parent.id, title: 'C', variant: ['pub'] },
        overrideAccess: true,
      })
      const noteD = await payload.create({
        collection: mongoJoinNotesSlug,
        data: { isVisible: true, parent: [parent.id], title: 'D', variant: 'publisher' },
        overrideAccess: true,
      })

      await payload.create({
        collection: mongoJoinArticlesSlug,
        data: { articleScope: 'shared', parent: parent.id, title: 'AA', variant: ['private'] },
        overrideAccess: true,
      })
      await payload.create({
        collection: mongoJoinNotesSlug,
        data: { isVisible: false, parent: [parent.id], title: 'BB', variant: 'public' },
        overrideAccess: true,
      })
      await payload.create({
        collection: mongoJoinNotesSlug,
        data: { isVisible: true, parent: [parent.id], title: 'E', variant: 'public' },
        overrideAccess: true,
      })

      const readPage = async (page: number) => {
        const result = await payload.findByID({
          collection: mongoJoinParentsSlug,
          context: { allowedParentID: parent.id },
          depth: 0,
          id: parent.id,
          joins: {
            children: {
              count: true,
              limit: 2,
              page,
              sort: 'title',
              where: { title: { not_equals: 'E' } },
            },
          },
          overrideAccess: false,
          user,
        })

        return result.children
      }

      expect(await readPage(1)).toMatchObject({
        docs: [
          { relationTo: mongoJoinArticlesSlug, value: articleA.id },
          { relationTo: mongoJoinNotesSlug, value: noteB.id },
        ],
        hasNextPage: true,
        totalDocs: 4,
      })
      expect(await readPage(2)).toMatchObject({
        docs: [
          { relationTo: mongoJoinArticlesSlug, value: articleC.id },
          { relationTo: mongoJoinNotesSlug, value: noteD.id },
        ],
        hasNextPage: false,
        totalDocs: 4,
      })
    })
  },
)
