import { expect } from 'vitest'

import { test } from '../__helpers/int/vitest.js'
import { accessJoinArticlesSlug, accessJoinNotesSlug, accessJoinParentsSlug } from './shared.js'

test.suite('Polymorphic join collection access', { config: './config.ts' }, () => {
  for (const useJoinAggregations of [true, false]) {
    test.options.describe(
      useJoinAggregations ? 'aggregation' : 'fallback',
      useJoinAggregations ? {} : { db: 'mongo' },
      () => {
        test.beforeEach(({ payload }) => {
          if ('useJoinAggregations' in payload.db) {
            payload.db.useJoinAggregations = useJoinAggregations
          }
        })

        test.afterEach(({ payload }) => {
          if ('useJoinAggregations' in payload.db) {
            payload.db.useJoinAggregations = true
          }
        })
        for (const deniedCollection of [accessJoinArticlesSlug, accessJoinNotesSlug]) {
          test(`should preserve readable targets when ${deniedCollection} denies access`, async ({
            payload,
          }) => {
            const {
              docs: [user],
            } = await payload.find({ collection: 'users', overrideAccess: true })
            const parent = await payload.create({
              collection: accessJoinParentsSlug,
              data: {},
              overrideAccess: true,
            })
            const readableCollection =
              deniedCollection === accessJoinArticlesSlug
                ? accessJoinNotesSlug
                : accessJoinArticlesSlug
            const readable = await payload.create({
              collection: readableCollection,
              data: { parent: parent.id, title: 'Readable' },
              overrideAccess: true,
            })

            await payload.create({
              collection: deniedCollection,
              data: { parent: parent.id, title: 'Denied' },
              overrideAccess: true,
            })

            const articleAccess = payload.collections[accessJoinArticlesSlug].config.access
            const noteAccess = payload.collections[accessJoinNotesSlug].config.access
            const originalArticleRead = articleAccess.read
            const originalNoteRead = noteAccess.read

            articleAccess.read = () => deniedCollection !== accessJoinArticlesSlug
            noteAccess.read = () => deniedCollection !== accessJoinNotesSlug

            try {
              const result = await payload.findByID({
                collection: accessJoinParentsSlug,
                id: parent.id,
                depth: 0,
                overrideAccess: false,
                user,
                joins: { children: { count: true, limit: 1 } },
              })

              expect(
                result.children.docs.map(({ relationTo, value }) => ({ relationTo, value })),
              ).toEqual([{ relationTo: readableCollection, value: readable.id }])
              expect(result.children.totalDocs).toBe(1)
            } finally {
              articleAccess.read = originalArticleRead
              noteAccess.read = originalNoteRead
            }
          })
        }

        test('should scope each target access constraint before counting and pagination', async ({
          payload,
        }) => {
          const {
            docs: [user],
          } = await payload.find({ collection: 'users', overrideAccess: true })
          const parent = await payload.create({
            collection: accessJoinParentsSlug,
            data: {},
            overrideAccess: true,
          })
          const expected = []

          for (const collection of [accessJoinArticlesSlug, accessJoinNotesSlug]) {
            const readable = await payload.create({
              collection,
              data: { parent: parent.id, title: collection },
              overrideAccess: true,
            })

            expected.push({ relationTo: collection, value: readable.id })
            await payload.create({
              collection,
              data: {
                parent: parent.id,
                title:
                  collection === accessJoinArticlesSlug
                    ? accessJoinNotesSlug
                    : accessJoinArticlesSlug,
              },
              overrideAccess: true,
            })
          }

          const articleAccess = payload.collections[accessJoinArticlesSlug].config.access
          const noteAccess = payload.collections[accessJoinNotesSlug].config.access
          const originalArticleRead = articleAccess.read
          const originalNoteRead = noteAccess.read
          articleAccess.read = () => ({ title: { equals: accessJoinArticlesSlug } })
          noteAccess.read = () => ({ title: { equals: accessJoinNotesSlug } })

          try {
            for (const page of [1, 2]) {
              const result = await payload.findByID({
                collection: accessJoinParentsSlug,
                id: parent.id,
                depth: 0,
                overrideAccess: false,
                user,
                joins: { children: { count: true, limit: 1, page, sort: 'title' } },
              })

              expect(
                result.children.docs.map(({ relationTo, value }) => ({ relationTo, value })),
              ).toEqual([expected[page - 1]])
              expect(result.children.totalDocs).toBe(2)
            }
          } finally {
            articleAccess.read = originalArticleRead
            noteAccess.read = originalNoteRead
          }
        })
      },
    )
  }
})
