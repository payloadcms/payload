import type { MongooseAdapter } from '@payloadcms/db-mongodb'

import { expect } from 'vitest'

import { test } from '../__helpers/int/vitest.js'
import { accessJoinArticlesSlug, accessJoinNotesSlug, accessJoinParentsSlug } from './shared.js'

test.suite('Polymorphic fallback query conditions', { config: './config.ts', db: 'mongo' }, () => {
  let originalUseJoinAggregations: boolean

  test.beforeEach(({ payload }) => {
    const adapter = payload.db as unknown as MongooseAdapter

    originalUseJoinAggregations = adapter.useJoinAggregations
    adapter.useJoinAggregations = false
  })

  test.afterEach(({ payload }) => {
    const adapter = payload.db as unknown as MongooseAdapter

    adapter.useJoinAggregations = originalUseJoinAggregations
  })

  test('should reject exists constraints on the collection discriminator', async ({ payload }) => {
    const parent = await payload.create({
      collection: accessJoinParentsSlug,
      data: {},
      overrideAccess: true,
    })

    await payload.create({
      collection: accessJoinArticlesSlug,
      data: { parent: parent.id, title: 'Article' },
      overrideAccess: true,
    })

    for (const exists of [true, false]) {
      await expect(
        payload.findByID({
          collection: accessJoinParentsSlug,
          id: parent.id,
          depth: 0,
          overrideAccess: true,
          joins: { children: { where: { relationTo: { exists } } } },
        }),
      ).rejects.toMatchObject({ name: 'QueryError', data: [{ path: 'relationTo.exists' }] })
    }
  })

  test('should reject collection operators the fallback cannot evaluate', async ({ payload }) => {
    const parent = await payload.create({
      collection: accessJoinParentsSlug,
      data: {},
      overrideAccess: true,
    })

    await expect(
      payload.findByID({
        collection: accessJoinParentsSlug,
        id: parent.id,
        depth: 0,
        overrideAccess: true,
        joins: { children: { where: { relationTo: { like: 'articles' } } } },
      }),
    ).rejects.toMatchObject({ name: 'QueryError', data: [{ path: 'relationTo.like' }] })
  })

  test('should apply a configured group field constraint before counting', async ({ payload }) => {
    const parent = await payload.create({
      collection: accessJoinParentsSlug,
      data: {},
      overrideAccess: true,
    })
    const article = await payload.create({
      collection: accessJoinArticlesSlug,
      data: { parent: parent.id, title: 'Public article', details: { status: 'public' } },
      overrideAccess: true,
    })

    await payload.create({
      collection: accessJoinArticlesSlug,
      data: { parent: parent.id, title: 'Private article', details: { status: 'private' } },
      overrideAccess: true,
    })
    await payload.create({
      collection: accessJoinNotesSlug,
      data: { parent: parent.id, title: 'Note without the group field' },
      overrideAccess: true,
    })

    const result = await payload.findByID({
      collection: accessJoinParentsSlug,
      id: parent.id,
      depth: 0,
      overrideAccess: true,
      joins: { children: { count: true, where: { 'details.status': { equals: 'public' } } } },
    })

    expect(result.children).toMatchObject({
      docs: [{ relationTo: accessJoinArticlesSlug, value: article.id }],
      totalDocs: 1,
      hasNextPage: false,
    })
  })

  test('should apply named tab field constraints to each target', async ({ payload }) => {
    const parent = await payload.create({
      collection: accessJoinParentsSlug,
      data: {},
      overrideAccess: true,
    })
    const article = await payload.create({
      collection: accessJoinArticlesSlug,
      data: { parent: parent.id, title: 'Approved article', articleMeta: { status: 'approved' } },
      overrideAccess: true,
    })

    await payload.create({
      collection: accessJoinNotesSlug,
      data: { parent: parent.id, title: 'Pending note', articleMeta: { status: 'pending' } },
      overrideAccess: true,
    })

    const result = await payload.findByID({
      collection: accessJoinParentsSlug,
      id: parent.id,
      depth: 0,
      overrideAccess: true,
      joins: { children: { count: true, where: { 'articleMeta.status': { equals: 'approved' } } } },
    })

    expect(result.children).toMatchObject({
      docs: [{ relationTo: accessJoinArticlesSlug, value: article.id }],
      totalDocs: 1,
    })
  })

  test('should not treat a scalar field as a container for another field', async ({ payload }) => {
    const parent = await payload.create({
      collection: accessJoinParentsSlug,
      data: {},
      overrideAccess: true,
    })

    await payload.create({
      collection: accessJoinArticlesSlug,
      data: { parent: parent.id, title: 'Article' },
      overrideAccess: true,
    })

    const result = await payload.findByID({
      collection: accessJoinParentsSlug,
      id: parent.id,
      depth: 0,
      overrideAccess: true,
      joins: { children: { count: true, where: { 'title.title': { exists: false } } } },
    })

    expect(result.children).toMatchObject({ docs: [], totalDocs: 0, hasNextPage: false })
  })

  test('should enforce nested read constraints before returning pagination metadata', async ({
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
    const article = await payload.create({
      collection: accessJoinArticlesSlug,
      data: { parent: parent.id, title: 'Public article', details: { status: 'public' } },
      overrideAccess: true,
    })

    await payload.create({
      collection: accessJoinArticlesSlug,
      data: { parent: parent.id, title: 'A private article', details: { status: 'private' } },
      overrideAccess: true,
    })
    await payload.create({
      collection: accessJoinNotesSlug,
      data: { parent: parent.id, title: 'A denied note' },
      overrideAccess: true,
    })

    const articleAccess = payload.collections[accessJoinArticlesSlug].config.access
    const noteAccess = payload.collections[accessJoinNotesSlug].config.access
    const originalArticleRead = articleAccess.read
    const originalNoteRead = noteAccess.read

    articleAccess.read = () => ({ 'details.status': { equals: 'public' } })
    noteAccess.read = () => false

    try {
      const result = await payload.findByID({
        collection: accessJoinParentsSlug,
        id: parent.id,
        depth: 0,
        overrideAccess: false,
        user,
        joins: { children: { count: true, limit: 1, sort: 'title' } },
      })

      expect(result.children).toMatchObject({
        docs: [{ relationTo: accessJoinArticlesSlug, value: article.id }],
        totalDocs: 1,
        hasNextPage: false,
      })
    } finally {
      articleAccess.read = originalArticleRead
      noteAccess.read = originalNoteRead
    }
  })
})
