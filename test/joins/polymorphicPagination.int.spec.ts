import type { MongooseAdapter } from '@payloadcms/db-mongodb'
import type { Payload } from 'payload'

import { expect } from 'vitest'

import { test } from '../__helpers/int/vitest.js'
import { accessJoinArticlesSlug, accessJoinNotesSlug, accessJoinParentsSlug } from './shared.js'

test.suite('Polymorphic join pagination', { config: './config.ts', db: 'mongo' }, () => {
  for (const useJoinAggregations of [true, false]) {
    for (const count of [true, false]) {
      test.describe(`aggregations=${useJoinAggregations}, count=${count}`, () => {
        let originalUseJoinAggregations: boolean

        test.beforeEach(({ payload }) => {
          const adapter = payload.db as unknown as MongooseAdapter

          originalUseJoinAggregations = adapter.useJoinAggregations
          adapter.useJoinAggregations = useJoinAggregations
        })

        test.afterEach(({ payload }) => {
          const adapter = payload.db as unknown as MongooseAdapter

          adapter.useJoinAggregations = originalUseJoinAggregations
        })

        test('should detect another page when only one target has results', async ({ payload }) => {
          const { parentID, articles } = await createJoinedDocuments({
            payload,
            articles: ['Accessibility', 'Community', 'Events'],
          })
          const children = await findJoinedPage({ payload, parentID, page: 1, limit: 2, count })

          expect(children).toMatchObject({
            docs: [articles[0], articles[1]],
            hasNextPage: true,
          })
          expect(children?.totalDocs).toBe(count ? 3 : undefined)
        })

        test('should stop on an exactly full final mixed page', async ({ payload }) => {
          const { parentID, articles, notes } = await createJoinedDocuments({
            payload,
            articles: ['Accessibility', 'Events'],
            notes: ['Community', 'Governance'],
          })
          const children = await findJoinedPage({ payload, parentID, page: 2, limit: 2, count })

          expect(children).toMatchObject({
            docs: [articles[1], notes[1]],
            hasNextPage: false,
          })
          expect(children?.totalDocs).toBe(count ? 4 : undefined)
        })

        test('should detect another page after a mixed second page', async ({ payload }) => {
          const { parentID, articles, notes } = await createJoinedDocuments({
            payload,
            articles: ['Accessibility', 'Events', 'Membership'],
            notes: ['Community', 'Governance'],
          })
          const children = await findJoinedPage({ payload, parentID, page: 2, limit: 2, count })

          expect(children).toMatchObject({
            docs: [articles[1], notes[1]],
            hasNextPage: true,
          })
          expect(children?.totalDocs).toBe(count ? 5 : undefined)
        })

        test('should report counts and next pages separately for each parent', async ({
          payload,
        }) => {
          const smaller = await createJoinedDocuments({ payload, notes: ['Membership'] })
          const larger = await createJoinedDocuments({
            payload,
            articles: ['Accessibility', 'Events'],
            notes: ['Community'],
          })
          const empty = await createJoinedDocuments({ payload })

          const { docs } = await payload.find({
            collection: accessJoinParentsSlug,
            depth: 0,
            joins: { children: { count, limit: 2, sort: 'title' } },
            overrideAccess: true,
            where: { id: { in: [smaller.parentID, larger.parentID, empty.parentID] } },
          })

          const smallerChildren = docs.find(({ id }) => id === smaller.parentID)?.children
          const largerChildren = docs.find(({ id }) => id === larger.parentID)?.children
          const emptyChildren = docs.find(({ id }) => id === empty.parentID)?.children

          expect(smallerChildren).toMatchObject({
            docs: smaller.notes,
            hasNextPage: false,
          })
          expect(smallerChildren?.totalDocs).toBe(count ? 1 : undefined)
          expect(largerChildren).toMatchObject({
            docs: [larger.articles[0], larger.notes[0]],
            hasNextPage: true,
          })
          expect(largerChildren?.totalDocs).toBe(count ? 3 : undefined)
          expect(emptyChildren).toMatchObject({ docs: [], hasNextPage: false })
          expect(emptyChildren?.totalDocs).toBe(count ? 0 : undefined)
        })

        test('should return an empty page past the mixed results', async ({ payload }) => {
          const { parentID } = await createJoinedDocuments({
            payload,
            articles: ['Accessibility', 'Events'],
            notes: ['Community'],
          })
          const children = await findJoinedPage({ payload, parentID, page: 3, limit: 2, count })

          expect(children).toMatchObject({
            docs: [],
            hasNextPage: false,
          })
          expect(children?.totalDocs).toBe(count ? 3 : undefined)
        })

        test('should return empty results without another page', async ({ payload }) => {
          const { parentID } = await createJoinedDocuments({
            payload,
          })
          const children = await findJoinedPage({ payload, parentID, page: 1, limit: 2, count })

          expect(children).toMatchObject({
            docs: [],
            hasNextPage: false,
          })
          expect(children?.totalDocs).toBe(count ? 0 : undefined)
        })

        test('should return all mixed results with an unlimited join', async ({ payload }) => {
          const { parentID, articles, notes } = await createJoinedDocuments({
            payload,
            articles: ['Accessibility', 'Events'],
            notes: ['Community'],
          })
          const children = await findJoinedPage({ payload, parentID, page: 2, limit: 0, count })

          expect(children).toMatchObject({
            docs: [articles[0], notes[0], articles[1]],
            hasNextPage: false,
          })
          expect(children?.totalDocs).toBe(count ? 3 : undefined)
        })
      })
    }
  }
})

async function createJoinedDocuments({
  payload,
  articles = [],
  notes = [],
}: {
  articles?: string[]
  notes?: string[]
  payload: Payload
}) {
  const parent = await payload.create({
    collection: accessJoinParentsSlug,
    data: {},
    depth: 0,
    overrideAccess: true,
  })
  const createdArticles = await createChildren({
    payload,
    parentID: parent.id,
    collection: accessJoinArticlesSlug,
    titles: articles,
  })
  const createdNotes = await createChildren({
    payload,
    parentID: parent.id,
    collection: accessJoinNotesSlug,
    titles: notes,
  })

  return { parentID: parent.id, articles: createdArticles, notes: createdNotes }
}

async function createChildren({
  payload,
  parentID,
  collection,
  titles,
}: {
  collection: typeof accessJoinArticlesSlug | typeof accessJoinNotesSlug
  parentID: number | string
  payload: Payload
  titles: string[]
}) {
  const references = []

  for (const title of titles) {
    const child = await payload.create({
      collection,
      data: { parent: parentID, title },
      depth: 0,
      overrideAccess: true,
    })

    references.push({ relationTo: collection, value: child.id })
  }

  return references
}

async function findJoinedPage({
  payload,
  parentID,
  page,
  limit,
  count,
}: {
  count: boolean
  limit: number
  page: number
  parentID: number | string
  payload: Payload
}) {
  const result = await payload.findByID({
    collection: accessJoinParentsSlug,
    id: parentID,
    depth: 0,
    overrideAccess: true,
    joins: { children: { count, limit, page, sort: 'title' } },
  })

  return result.children
}
