import { expect } from 'vitest'

import { test } from '../__helpers/int/vitest.js'
import { accessJoinArticlesSlug, accessJoinNotesSlug, accessJoinParentsSlug } from './shared.js'

test.suite('Polymorphic join nested fields', { config: './config.ts' }, () => {
  test.options(
    'should paginate documents once when several array rows match',
    { db: 'drizzle' },
    async ({ payload }) => {
      const {
        docs: [user],
      } = await payload.find({ collection: 'users', overrideAccess: true })
      const parent = await payload.create({
        overrideAccess: true,
        collection: accessJoinParentsSlug,
        data: {},
      })
      const article = await payload.create({
        overrideAccess: true,
        collection: accessJoinArticlesSlug,
        data: {
          parent: parent.id,
          title: 'Accessible guide',
          tags: ['available'],
          items: [{ heading: 'Welcome readers' }, { heading: 'Welcome editors' }],
        },
      })
      const note = await payload.create({
        overrideAccess: true,
        collection: accessJoinNotesSlug,
        data: {
          parent: parent.id,
          title: 'Welcome note',
          availability: 'available',
          tags: ['available'],
          items: [{ heading: 'Welcome visitors' }],
        },
      })

      await payload.create({
        overrideAccess: true,
        collection: accessJoinArticlesSlug,
        data: {
          parent: parent.id,
          title: 'Unrelated guide',
          tags: ['available'],
          items: [{ heading: 'Goodbye' }],
        },
      })
      await payload.create({
        overrideAccess: true,
        collection: accessJoinArticlesSlug,
        data: {
          parent: parent.id,
          title: 'restricted child',
          tags: ['available'],
          items: [{ heading: 'Welcome staff' }],
        },
      })

      const firstPage = await payload.findByID({
        collection: accessJoinParentsSlug,
        id: parent.id,
        depth: 0,
        overrideAccess: false,
        user,
        joins: {
          children: {
            count: true,
            limit: 1,
            sort: 'title',
            where: { 'items.heading': { contains: 'Welcome' } },
          },
        },
      })
      const secondPage = await payload.findByID({
        collection: accessJoinParentsSlug,
        id: parent.id,
        depth: 0,
        overrideAccess: false,
        user,
        joins: {
          children: {
            count: true,
            limit: 1,
            page: 2,
            sort: 'title',
            where: { 'items.heading': { contains: 'Welcome' } },
          },
        },
      })

      expect(firstPage.children).toMatchObject({
        docs: [{ relationTo: accessJoinArticlesSlug, value: article.id }],
        totalDocs: 2,
        hasNextPage: true,
      })
      expect(secondPage.children).toMatchObject({
        docs: [{ relationTo: accessJoinNotesSlug, value: note.id }],
        totalDocs: 2,
        hasNextPage: false,
      })
    },
  )

  test.options(
    'should filter block fields without duplicating documents',
    { db: 'drizzle' },
    async ({ payload }) => {
      const parent = await payload.create({
        overrideAccess: true,
        collection: accessJoinParentsSlug,
        data: {},
      })
      const article = await payload.create({
        overrideAccess: true,
        collection: accessJoinArticlesSlug,
        data: {
          parent: parent.id,
          title: 'Article',
          content: [
            { blockType: 'section', heading: 'Welcome readers' },
            { blockType: 'section', heading: 'Welcome editors' },
          ],
        },
      })
      const note = await payload.create({
        overrideAccess: true,
        collection: accessJoinNotesSlug,
        data: {
          parent: parent.id,
          title: 'Note',
          content: [{ blockType: 'section', heading: 'Welcome visitors' }],
        },
      })

      await payload.create({
        overrideAccess: true,
        collection: accessJoinArticlesSlug,
        data: {
          parent: parent.id,
          title: 'Unrelated article',
          content: [{ blockType: 'section', heading: 'Goodbye' }],
        },
      })

      const result = await payload.findByID({
        collection: accessJoinParentsSlug,
        id: parent.id,
        depth: 0,
        overrideAccess: true,
        joins: {
          children: {
            count: true,
            sort: 'title',
            where: { 'content.heading': { contains: 'Welcome' } },
          },
        },
      })

      expect(result.children).toMatchObject({
        docs: [
          { relationTo: accessJoinArticlesSlug, value: article.id },
          { relationTo: accessJoinNotesSlug, value: note.id },
        ],
        totalDocs: 2,
      })
    },
  )
})
