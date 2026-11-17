import type { MongooseAdapter } from '@payloadcms/db-mongodb'

import { expect } from 'vitest'

import { test } from '../__helpers/int/vitest.js'
import { accessJoinArticlesSlug, accessJoinNotesSlug, accessJoinParentsSlug } from './shared.js'

const scenarios = [
  {
    name: 'detect another page when only one target has results',
    collections: [accessJoinArticlesSlug, accessJoinArticlesSlug, accessJoinArticlesSlug],
    page: 1,
    limit: 2,
  },
  {
    name: 'stop on an exactly full final mixed page',
    collections: [
      accessJoinArticlesSlug,
      accessJoinNotesSlug,
      accessJoinArticlesSlug,
      accessJoinNotesSlug,
    ],
    page: 2,
    limit: 2,
  },
  {
    name: 'detect another page after a mixed second page',
    collections: [
      accessJoinArticlesSlug,
      accessJoinNotesSlug,
      accessJoinArticlesSlug,
      accessJoinNotesSlug,
      accessJoinArticlesSlug,
    ],
    page: 2,
    limit: 2,
  },
  {
    name: 'return an empty page past the mixed results',
    collections: [accessJoinArticlesSlug, accessJoinNotesSlug, accessJoinArticlesSlug],
    page: 3,
    limit: 2,
  },
  { name: 'return empty results without another page', collections: [], page: 1, limit: 2 },
  {
    name: 'return all mixed results with an unlimited join',
    collections: [accessJoinArticlesSlug, accessJoinNotesSlug, accessJoinArticlesSlug],
    page: 2,
    limit: 0,
  },
] as const

test.suite('Polymorphic join pagination', { config: './config.ts', db: 'mongo' }, () => {
  for (const useJoinAggregations of [true, false]) {
    for (const count of [true, false]) {
      test.describe(`aggregations=${useJoinAggregations}, count=${count}`, () => {
        for (const { name, collections, page, limit } of scenarios) {
          test(`should ${name}`, async ({ payload }) => {
            const parent = await payload.create({
              collection: accessJoinParentsSlug,
              data: {},
              depth: 0,
              overrideAccess: true,
            })
            const references = []

            for (const [index, collection] of collections.entries()) {
              const child = await payload.create({
                collection,
                data: { parent: parent.id, title: `Result ${index}` },
                depth: 0,
                overrideAccess: true,
              })

              references.push({ relationTo: collection, value: child.id })
            }

            const adapter = payload.db as unknown as MongooseAdapter
            const originalUseJoinAggregations = adapter.useJoinAggregations

            adapter.useJoinAggregations = useJoinAggregations

            try {
              const result = await payload.findByID({
                collection: accessJoinParentsSlug,
                id: parent.id,
                depth: 0,
                overrideAccess: true,
                joins: { children: { count, limit, page, sort: 'title' } },
              })
              const offset = limit === 0 ? 0 : (page - 1) * limit
              const expectedReferences =
                limit === 0 ? references : references.slice(offset, offset + limit)

              expect(
                result.children?.docs?.map(({ relationTo, value }) => ({ relationTo, value })),
              ).toEqual(expectedReferences)
              expect(result.children?.hasNextPage).toBe(
                limit > 0 && references.length > offset + limit,
              )

              expect(result.children?.totalDocs).toBe(count ? references.length : undefined)
            } finally {
              adapter.useJoinAggregations = originalUseJoinAggregations
            }
          })
        }
      })
    }
  }
})
