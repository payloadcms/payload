import { expect } from 'vitest'

import { test } from '../__helpers/int/vitest.js'
import { articlesSlug, draftArticlesSlug, notesSlug, topicsSlug } from './collections/index.js'

test.suite('Polymorphic joins through relationships', { config: './config.ts' }, () => {
  test.options(
    'should match hasMany members by document ID when reading a draft version',
    { db: 'drizzle' },
    async ({ payload }) => {
      const unrelated = await payload.create({
        collection: topicsSlug,
        data: { title: 'Unrelated' },
        overrideAccess: true,
      })

      await payload.update({
        id: unrelated.id,
        collection: topicsSlug,
        data: { title: 'Updated unrelated' },
        draft: true,
        overrideAccess: true,
      })

      const topic = await payload.create({
        collection: topicsSlug,
        data: { title: 'Featured' },
        overrideAccess: true,
      })
      const article = await payload.create({
        collection: articlesSlug,
        data: { title: 'Visible member', published: true, topics: [topic.id] },
        overrideAccess: true,
      })
      const { docs: versions } = await payload.findVersions({
        collection: topicsSlug,
        overrideAccess: true,
        where: { parent: { equals: topic.id } },
      })

      expect(versions).toHaveLength(1)
      expect(versions[0]?.id).not.toBe(topic.id)

      const draft = await payload.findByID({
        id: topic.id,
        collection: topicsSlug,
        depth: 0,
        draft: true,
        joins: { members: { count: true } },
        overrideAccess: false,
      })

      expect(draft.members).toMatchObject({
        docs: [{ relationTo: articlesSlug, value: article.id }],
        hasNextPage: false,
        totalDocs: 1,
      })
    },
  )

  test.options(
    'should read draft relationships from versioned targets alongside live targets',
    { db: 'drizzle' },
    async ({ payload }) => {
      const topic = await payload.create({
        collection: topicsSlug,
        data: { title: 'Featured' },
        overrideAccess: true,
      })
      const liveArticle = await payload.create({
        collection: articlesSlug,
        data: { title: 'M live', published: true, topics: [topic.id] },
        overrideAccess: true,
      })
      const draftArticle = await payload.create({
        collection: draftArticlesSlug,
        data: { title: 'Z old', visible: true },
        overrideAccess: true,
      })

      await payload.update({
        id: draftArticle.id,
        collection: draftArticlesSlug,
        data: { title: 'A draft', topics: [topic.id] },
        draft: true,
        overrideAccess: true,
      })

      const hiddenArticle = await payload.create({
        collection: draftArticlesSlug,
        data: { title: 'B hidden', visible: false },
        overrideAccess: true,
      })

      await payload.update({
        id: hiddenArticle.id,
        collection: draftArticlesSlug,
        data: { topics: [topic.id] },
        draft: true,
        overrideAccess: true,
      })

      const published = await payload.findByID({
        id: topic.id,
        collection: topicsSlug,
        depth: 0,
        joins: { members: { count: true, sort: 'title' } },
        overrideAccess: false,
      })
      const draft = await payload.findByID({
        id: topic.id,
        collection: topicsSlug,
        depth: 0,
        draft: true,
        joins: { members: { count: true, sort: 'title' } },
        overrideAccess: false,
      })

      expect(published.members).toMatchObject({
        docs: [{ relationTo: articlesSlug, value: liveArticle.id }],
        totalDocs: 1,
      })
      expect(draft.members).toMatchObject({
        docs: [
          { relationTo: draftArticlesSlug, value: draftArticle.id },
          { relationTo: articlesSlug, value: liveArticle.id },
        ],
        totalDocs: 2,
      })
    },
  )

  test.options(
    'should filter versioned members by a draft hasMany select field',
    { db: 'drizzle' },
    async ({ payload }) => {
      const topic = await payload.create({
        collection: topicsSlug,
        data: { title: 'Featured' },
        overrideAccess: true,
      })
      const article = await payload.create({
        collection: draftArticlesSlug,
        data: { title: 'Tagged', visible: true },
        overrideAccess: true,
      })

      await payload.update({
        id: article.id,
        collection: draftArticlesSlug,
        data: { tags: ['featured'], topics: [topic.id] },
        draft: true,
        overrideAccess: true,
      })

      const draft = await payload.findByID({
        id: topic.id,
        collection: topicsSlug,
        depth: 0,
        draft: true,
        joins: { members: { count: true, where: { tags: { contains: 'featured' } } } },
        overrideAccess: false,
      })

      expect(draft.members).toMatchObject({
        docs: [{ relationTo: draftArticlesSlug, value: article.id }],
        totalDocs: 1,
      })
    },
  )

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
