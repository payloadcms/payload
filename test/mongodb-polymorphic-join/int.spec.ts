import type { MongooseAdapter } from '@payloadcms/db-mongodb'

import { expect } from 'vitest'

import { test } from '../__helpers/int/vitest.js'
import {
  mongoJoinArticlesSlug,
  mongoJoinNotesSlug,
  mongoJoinParentsSlug,
  mongoJoinUsersSlug,
} from './collections/MongoPolymorphicAggregation.js'

test.suite('MongoDB polymorphic join aggregation', { config: './config.ts', db: 'mongo' }, () => {
  test('should filter each target before counting and paging a mixed join', async ({ payload }) => {
    const user = await payload.create({
      collection: mongoJoinUsersSlug,
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
      data: {
        articleScope: 'shared',
        owner: user.id,
        parent: parent.id,
        title: 'A',
        variant: ['pub'],
      },
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
      data: {
        articleScope: 'shared',
        owner: user.id,
        parent: parent.id,
        title: 'C',
        variant: ['pub'],
      },
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

    const adapter = payload.db as unknown as MongooseAdapter
    const wasJoinAggregationEnabled = adapter.useJoinAggregations

    try {
      for (const shouldUseJoinAggregations of [true, false]) {
        adapter.useJoinAggregations = shouldUseJoinAggregations

        const result = await payload.findByID({
          collection: mongoJoinParentsSlug,
          context: { allowedParentID: parent.id },
          depth: 0,
          id: parent.id,
          joins: {
            children: {
              count: true,
              limit: 2,
              page: 2,
              sort: 'title',
              where: {
                or: [
                  {
                    owner: { equals: user.id },
                    parent: { equals: parent.id },
                    relationTo: { equals: mongoJoinArticlesSlug },
                  },
                  {
                    parent: { in: [otherParent.id] },
                    relationTo: { equals: mongoJoinNotesSlug },
                  },
                ],
              },
            },
          },
          overrideAccess: false,
          user,
        })

        expect(result.children).toMatchObject({
          docs: [{ relationTo: mongoJoinArticlesSlug, value: articleC.id }],
          hasNextPage: false,
          totalDocs: 3,
        })
      }
    } finally {
      adapter.useJoinAggregations = wasJoinAggregationEnabled
    }

    const noTargets = await payload.findByID({
      collection: mongoJoinParentsSlug,
      context: { allowedParentID: parent.id },
      depth: 0,
      id: parent.id,
      joins: {
        children: {
          count: true,
          limit: 2,
          where: { relationTo: { in: [] } },
        },
      },
      overrideAccess: false,
      user,
    })

    expect(noTargets.children).toMatchObject({ docs: [], hasNextPage: false, totalDocs: 0 })
  })

  test('should keep nested JSON caller filters queryable', async ({ payload }) => {
    const parent = await payload.create({
      collection: mongoJoinParentsSlug,
      data: {},
      overrideAccess: true,
    })
    const approved = await payload.create({
      collection: mongoJoinArticlesSlug,
      data: { metadata: { approved: true }, parent: parent.id, title: 'Approved' },
      overrideAccess: true,
    })

    await payload.create({
      collection: mongoJoinNotesSlug,
      data: { metadata: { approved: false }, parent: [parent.id], title: 'Not approved' },
      overrideAccess: true,
    })

    const result = await payload.findByID({
      collection: mongoJoinParentsSlug,
      depth: 0,
      id: parent.id,
      joins: { children: { count: true, where: { 'metadata.approved': { equals: true } } } },
      overrideAccess: true,
    })

    expect(result.children).toMatchObject({
      docs: [{ relationTo: mongoJoinArticlesSlug, value: approved.id }],
      totalDocs: 1,
    })
  })

  test('should keep nested relationship caller filters queryable', async ({ payload }) => {
    const owner = await payload.create({
      collection: mongoJoinUsersSlug,
      data: { email: 'owner@example.com', password: 'password' },
      overrideAccess: true,
    })
    const parent = await payload.create({
      collection: mongoJoinParentsSlug,
      data: {},
      overrideAccess: true,
    })
    const ownedArticle = await payload.create({
      collection: mongoJoinArticlesSlug,
      data: { owner: owner.id, parent: parent.id, title: 'Owned' },
      overrideAccess: true,
    })

    await payload.create({
      collection: mongoJoinNotesSlug,
      data: { parent: [parent.id], title: 'Unowned' },
      overrideAccess: true,
    })

    const result = await payload.findByID({
      collection: mongoJoinParentsSlug,
      depth: 0,
      id: parent.id,
      joins: { children: { count: true, where: { 'owner.id': { equals: owner.id } } } },
      overrideAccess: true,
    })

    expect(result.children).toMatchObject({
      docs: [{ relationTo: mongoJoinArticlesSlug, value: ownedArticle.id }],
      totalDocs: 1,
    })
  })
})
