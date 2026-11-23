import { expect } from 'vitest'

import { test } from '../__helpers/int/vitest.js'
import { articlesSlug, notesSlug, topicsSlug } from './collections/index.js'

test.suite('Polymorphic joins through relationships', { config: './config.ts' }, () => {
  test.options(
    'should count and page members once for the requested parent and field',
    { db: 'drizzle' },
    async ({ payload }) => {
      const featured = await payload.create({
        collection: topicsSlug,
        data: { title: 'Featured' },
        overrideAccess: true,
      })
      const archives = await payload.create({
        collection: topicsSlug,
        data: { title: 'Archives' },
        overrideAccess: true,
      })
      const article = await payload.create({
        collection: articlesSlug,
        overrideAccess: true,
        data: {
          title: 'Visible member',
          published: true,
          topics: [featured.id, archives.id, featured.id],
        },
      })
      await payload.create({
        collection: articlesSlug,
        overrideAccess: true,
        data: { title: 'A hidden', published: false, topics: [featured.id] },
      })
      await payload.create({
        collection: articlesSlug,
        overrideAccess: true,
        data: {
          title: 'A other field',
          published: true,
          otherTopics: [featured.id],
          topics: [archives.id],
        },
      })
      const note = await payload.create({
        collection: notesSlug,
        overrideAccess: true,
        data: { title: 'Visible member', topics: featured.id },
      })
      await payload.create({
        collection: notesSlug,
        overrideAccess: true,
        data: { title: 'A excluded note', topics: featured.id },
      })

      const readPage = async ({ page }: { page: number }) => {
        const topic = await payload.findByID({
          id: featured.id,
          collection: topicsSlug,
          depth: 0,
          joins: {
            members: {
              count: true,
              limit: 1,
              page,
              sort: 'title',
              where: { title: { not_equals: 'A excluded note' } },
            },
          },
          overrideAccess: false,
        })
        return topic.members
      }

      expect(await readPage({ page: 1 })).toMatchObject({
        docs: [{ relationTo: articlesSlug, value: article.id }],
        hasNextPage: true,
        totalDocs: 2,
      })
      expect(await readPage({ page: 2 })).toMatchObject({
        docs: [{ relationTo: notesSlug, value: note.id }],
        hasNextPage: false,
        totalDocs: 2,
      })
    },
  )
})
