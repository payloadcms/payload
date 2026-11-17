import type { MongooseAdapter } from '@payloadcms/db-mongodb'

import { expect } from 'vitest'

import { test } from '../__helpers/int/vitest.js'
import { accessJoinArticlesSlug, accessJoinNotesSlug, accessJoinParentsSlug } from './shared.js'

const scenarios = [
  {
    name: 'detect another page when only one target has results',
    articles: ['Accessibility', 'Community', 'Events'],
    notes: [],
    query: { page: 1, limit: 2 },
    expected: { titles: ['Accessibility', 'Community'], hasNextPage: true, totalDocs: 3 },
  },
  {
    name: 'stop on an exactly full final mixed page',
    articles: ['Accessibility', 'Events'],
    notes: ['Community', 'Governance'],
    query: { page: 2, limit: 2 },
    expected: { titles: ['Events', 'Governance'], hasNextPage: false, totalDocs: 4 },
  },
  {
    name: 'detect another page after a mixed second page',
    articles: ['Accessibility', 'Events', 'Membership'],
    notes: ['Community', 'Governance'],
    query: { page: 2, limit: 2 },
    expected: { titles: ['Events', 'Governance'], hasNextPage: true, totalDocs: 5 },
  },
  {
    name: 'return an empty page past the mixed results',
    articles: ['Accessibility', 'Events'],
    notes: ['Community'],
    query: { page: 3, limit: 2 },
    expected: { titles: [], hasNextPage: false, totalDocs: 3 },
  },
  {
    name: 'return empty results without another page',
    articles: [],
    notes: [],
    query: { page: 1, limit: 2 },
    expected: { titles: [], hasNextPage: false, totalDocs: 0 },
  },
  {
    name: 'return all mixed results with an unlimited join',
    articles: ['Accessibility', 'Events'],
    notes: ['Community'],
    query: { page: 2, limit: 0 },
    expected: {
      titles: ['Accessibility', 'Community', 'Events'],
      hasNextPage: false,
      totalDocs: 3,
    },
  },
] as const

test.suite('Polymorphic join pagination', { config: './config.ts', db: 'mongo' }, () => {
  for (const useJoinAggregations of [true, false]) {
    for (const count of [true, false]) {
      test.describe(`aggregations=${useJoinAggregations}, count=${count}`, () => {
        for (const { name, articles, notes, query, expected } of scenarios) {
          test(`should ${name}`, async ({ payload }) => {
            const parent = await payload.create({
              collection: accessJoinParentsSlug,
              data: {},
              depth: 0,
              overrideAccess: true,
            })
            const documentsByTitle = new Map<
              string,
              {
                relationTo: typeof accessJoinArticlesSlug | typeof accessJoinNotesSlug
                value: number | string
              }
            >()

            for (const { collection, titles } of [
              { collection: accessJoinArticlesSlug, titles: articles },
              { collection: accessJoinNotesSlug, titles: notes },
            ] as const) {
              for (const title of titles) {
                const child = await payload.create({
                  collection,
                  data: { parent: parent.id, title },
                  depth: 0,
                  overrideAccess: true,
                })

                documentsByTitle.set(title, { relationTo: collection, value: child.id })
              }
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
                joins: { children: { ...query, count, sort: 'title' } },
              })

              expect(
                result.children?.docs?.map(({ relationTo, value }) => ({ relationTo, value })),
              ).toEqual(expected.titles.map((title) => documentsByTitle.get(title)))
              expect(result.children?.hasNextPage).toBe(expected.hasNextPage)
              expect(result.children?.totalDocs).toBe(count ? expected.totalDocs : undefined)
            } finally {
              adapter.useJoinAggregations = originalUseJoinAggregations
            }
          })
        }
      })
    }
  }
})
