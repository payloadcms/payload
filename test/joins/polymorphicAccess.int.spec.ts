import type { Where } from 'payload'

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

        for (const [operator, constraint] of Object.entries({
          in: { relationTo: { in: [accessJoinArticlesSlug] } },
          not_in: { relationTo: { not_in: [accessJoinNotesSlug] } },
          not_equals: { relationTo: { not_equals: accessJoinNotesSlug } },
          nested: {
            and: [
              { relationTo: { in: [accessJoinArticlesSlug, accessJoinNotesSlug] } },
              {
                or: [
                  { relationTo: { equals: accessJoinArticlesSlug } },
                  { title: { equals: 'Absent' } },
                ],
              },
            ],
          },
        } satisfies Record<string, Where>)) {
          test(`should preserve caller ${operator} collection filters`, async ({ payload }) => {
            const parent = await payload.create({
              collection: accessJoinParentsSlug,
              data: {},
              overrideAccess: true,
            })
            const article = await payload.create({
              collection: accessJoinArticlesSlug,
              data: { parent: parent.id, title: 'Article' },
              overrideAccess: true,
            })

            await payload.create({
              collection: accessJoinNotesSlug,
              data: { parent: parent.id, title: 'Note' },
              overrideAccess: true,
            })

            const result = await payload.findByID({
              collection: accessJoinParentsSlug,
              id: parent.id,
              depth: 0,
              overrideAccess: true,
              joins: { children: { count: true, where: constraint } },
            })

            expect(
              result.children.docs.map(({ relationTo, value }) => ({ relationTo, value })),
            ).toEqual([{ relationTo: accessJoinArticlesSlug, value: article.id }])
            expect(result.children.totalDocs).toBe(1)
          })
        }

        test('should keep an outer document constraint when a nested OR matches the collection', async ({
          payload,
        }) => {
          const parent = await payload.create({
            collection: accessJoinParentsSlug,
            data: {},
            overrideAccess: true,
          })
          const article = await payload.create({
            collection: accessJoinArticlesSlug,
            data: { parent: parent.id, title: 'Selected article' },
            overrideAccess: true,
          })

          await payload.create({
            collection: accessJoinArticlesSlug,
            data: { parent: parent.id, title: 'Other article' },
            overrideAccess: true,
          })
          await payload.create({
            collection: accessJoinNotesSlug,
            data: { parent: parent.id, title: 'Public note' },
            overrideAccess: true,
          })

          const result = await payload.findByID({
            collection: accessJoinParentsSlug,
            id: parent.id,
            depth: 0,
            overrideAccess: true,
            joins: {
              children: {
                count: true,
                where: {
                  and: [
                    {
                      or: [
                        { relationTo: { equals: accessJoinArticlesSlug } },
                        { title: { equals: 'Public note' } },
                      ],
                    },
                    { title: { equals: 'Selected article' } },
                  ],
                },
              },
            },
          })

          expect(result.children).toMatchObject({
            docs: [{ relationTo: accessJoinArticlesSlug, value: article.id }],
            totalDocs: 1,
          })
        })

        test('should keep pagination metadata unchanged when unreadable documents are added', async ({
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
          const readable = await payload.create({
            collection: accessJoinNotesSlug,
            data: { parent: parent.id, title: 'Readable note' },
            overrideAccess: true,
          })
          const articleAccess = payload.collections[accessJoinArticlesSlug].config.access
          const noteAccess = payload.collections[accessJoinNotesSlug].config.access
          const originalArticleRead = articleAccess.read
          const originalNoteRead = noteAccess.read

          articleAccess.read = () => false
          noteAccess.read = () => ({ title: { equals: 'Readable note' } })

          const readPages = async () => {
            const pages = []

            for (const count of [true, false]) {
              for (const page of [1, 2, 3]) {
                const result = await payload.findByID({
                  collection: accessJoinParentsSlug,
                  id: parent.id,
                  depth: 0,
                  overrideAccess: false,
                  user,
                  joins: { children: { count, limit: 1, page, sort: 'title' } },
                })

                pages.push(result.children)
              }
            }

            return pages
          }

          try {
            const before = await readPages()

            expect(before[0]).toMatchObject({
              docs: [{ relationTo: accessJoinNotesSlug, value: readable.id }],
              totalDocs: 1,
              hasNextPage: false,
            })

            for (const collection of [accessJoinArticlesSlug, accessJoinNotesSlug]) {
              for (const title of ['Before readable', 'Unrelated', 'Z after readable']) {
                await payload.create({
                  collection,
                  data: { parent: parent.id, title },
                  overrideAccess: true,
                })
              }
            }

            expect(await readPages()).toEqual(before)
          } finally {
            articleAccess.read = originalArticleRead
            noteAccess.read = originalNoteRead
          }
        })

        test('should intersect read access on the join field with the parent restriction', async ({
          payload,
        }) => {
          const {
            docs: [user],
          } = await payload.find({ collection: 'users', overrideAccess: true })
          const allowedParent = await payload.create({
            collection: accessJoinParentsSlug,
            data: {},
            overrideAccess: true,
          })
          const otherParent = await payload.create({
            collection: accessJoinParentsSlug,
            data: {},
            overrideAccess: true,
          })
          const allowedArticle = await payload.create({
            collection: accessJoinArticlesSlug,
            data: { parent: allowedParent.id, title: 'Allowed article' },
            overrideAccess: true,
          })

          await payload.create({
            collection: accessJoinArticlesSlug,
            data: { parent: otherParent.id, title: 'Other article' },
            overrideAccess: true,
          })

          const articleAccess = payload.collections[accessJoinArticlesSlug].config.access
          const noteAccess = payload.collections[accessJoinNotesSlug].config.access
          const originalArticleRead = articleAccess.read
          const originalNoteRead = noteAccess.read
          articleAccess.read = () => ({ parent: { equals: allowedParent.id } })
          noteAccess.read = () => false

          const readParent = ({ id }: { id: typeof allowedParent.id }) =>
            payload.findByID({
              collection: accessJoinParentsSlug,
              id,
              depth: 0,
              overrideAccess: false,
              user,
              joins: { children: { count: true } },
            })

          try {
            expect((await readParent({ id: allowedParent.id })).children).toMatchObject({
              docs: [{ relationTo: accessJoinArticlesSlug, value: allowedArticle.id }],
              totalDocs: 1,
            })
            expect((await readParent({ id: otherParent.id })).children).toMatchObject({
              docs: [],
              totalDocs: 0,
            })
          } finally {
            articleAccess.read = originalArticleRead
            noteAccess.read = originalNoteRead
          }
        })

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
          articleAccess.read = () => ({ id: { in: [expected[0].value] } })
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
