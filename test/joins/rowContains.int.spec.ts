import type { Where } from 'payload'

import { expect } from 'vitest'

import { test } from '../__helpers/int/vitest.js'
import { accessJoinArticlesSlug } from './shared.js'

test.suite('Same row filters', { config: './config.ts' }, () => {
  test('should match the heading on the selected block', async ({ payload }) => {
    const matching = await payload.create({
      collection: accessJoinArticlesSlug,
      data: {
        content: [
          { blockType: 'section', heading: 'Introduction' },
          { blockType: 'hero', heading: 'Welcome' },
        ],
      },
      overrideAccess: true,
    })

    await payload.create({
      collection: accessJoinArticlesSlug,
      data: {
        content: [
          { blockType: 'section', heading: 'Welcome' },
          { blockType: 'hero', heading: 'Introduction' },
        ],
      },
      overrideAccess: true,
    })

    const { docs } = await payload.find({
      collection: accessJoinArticlesSlug,
      overrideAccess: true,
      where: {
        content: { contains: { blockType: { equals: 'hero' }, heading: { equals: 'Welcome' } } },
      },
    })

    expect(docs.map(({ id }) => id)).toEqual([matching.id])
  })

  test('should require one array row to satisfy every condition', async ({ payload }) => {
    const matching = await payload.create({
      collection: accessJoinArticlesSlug,
      data: { items: [{ heading: 'Welcome', published: true, rank: 1 }] },
      overrideAccess: true,
    })

    await payload.create({
      collection: accessJoinArticlesSlug,
      data: {
        items: [
          { heading: 'Welcome', published: false, rank: 1 },
          { heading: 'Introduction', published: true },
        ],
      },
      overrideAccess: true,
    })

    const { docs } = await payload.find({
      collection: accessJoinArticlesSlug,
      overrideAccess: true,
      where: {
        items: {
          contains: {
            heading: { equals: 'Welcome' },
            published: { equals: true },
            rank: { in: ['1'] },
          },
        },
      },
    })

    expect(docs.map(({ id }) => id)).toEqual([matching.id])
  })

  test('should filter rows inside a group and named tab', async ({ payload }) => {
    const article = await payload.create({
      collection: accessJoinArticlesSlug,
      data: {
        details: {
          editorial: {
            callouts: [{ blockType: 'editorNote', heading: 'Welcome' }],
            items: [{ heading: 'Welcome', published: true }],
          },
        },
      },
      overrideAccess: true,
    })

    await payload.create({
      collection: accessJoinArticlesSlug,
      data: {
        details: {
          editorial: {
            callouts: [{ blockType: 'editorNote', heading: 'Introduction' }],
            items: [{ heading: 'Welcome' }, { published: true }],
          },
        },
      },
      overrideAccess: true,
    })
    const filters: Where[] = [
      {
        'details.editorial.items': {
          contains: { heading: { equals: 'Welcome' }, published: { equals: true } },
        },
      },
      {
        'details.editorial.callouts': {
          contains: { blockType: { equals: 'editorNote' }, heading: { equals: 'Welcome' } },
        },
      },
    ]

    for (const where of filters) {
      for (const draft of [false, true]) {
        const { docs } = await payload.find({
          collection: accessJoinArticlesSlug,
          draft,
          overrideAccess: true,
          where,
        })

        expect(docs.map(({ id }) => id)).toEqual([article.id])
      }
    }
  })

  test('should enforce field access inside a block filter', async ({ payload }) => {
    const {
      docs: [user],
    } = await payload.find({ collection: 'users', overrideAccess: true })

    await expect(
      payload.find({
        collection: accessJoinArticlesSlug,
        context: { canReadHeroHeading: false },
        depth: 0,
        overrideAccess: false,
        user,
        where: {
          content: { contains: { blockType: { equals: 'hero' }, heading: { equals: 'Welcome' } } },
        },
      }),
    ).rejects.toThrow('content.heading')
  })

  test('should use the selected block when checking field access', async ({ payload }) => {
    const {
      docs: [user],
    } = await payload.find({ collection: 'users', overrideAccess: true })
    const article = await payload.create({
      collection: accessJoinArticlesSlug,
      data: { content: [{ blockType: 'hero', heading: 'Welcome' }], tags: ['available'] },
      overrideAccess: true,
    })

    const { docs } = await payload.find({
      collection: accessJoinArticlesSlug,
      context: { canReadSectionHeading: false },
      overrideAccess: false,
      user,
      where: {
        content: { contains: { blockType: { equals: 'hero' }, heading: { equals: 'Welcome' } } },
      },
    })

    expect(docs.map(({ id }) => id)).toEqual([article.id])
  })

  test('should filter draft rows by their latest values', async ({ payload }) => {
    const article = await payload.create({
      collection: accessJoinArticlesSlug,
      data: {
        content: [{ blockType: 'hero', heading: 'Published' }],
        items: [{ heading: 'Published' }],
      },
      overrideAccess: true,
    })

    await payload.update({
      collection: accessJoinArticlesSlug,
      id: article.id,
      data: { content: [{ blockType: 'hero', heading: 'Draft' }], items: [{ heading: 'Draft' }] },
      draft: true,
      overrideAccess: true,
    })

    const filters: Where[] = [
      { items: { contains: { heading: { equals: 'Draft' } } } },
      { content: { contains: { blockType: { equals: 'hero' }, heading: { equals: 'Draft' } } } },
    ]

    for (const where of filters) {
      const { docs } = await payload.find({
        collection: accessJoinArticlesSlug,
        draft: true,
        overrideAccess: true,
        where,
      })

      expect(docs.map(({ id }) => id)).toEqual([article.id])
    }
  })

  test('should reject an invalid number instead of matching an empty value', async ({
    payload,
  }) => {
    await expect(
      payload.find({
        collection: accessJoinArticlesSlug,
        overrideAccess: true,
        where: { items: { contains: { rank: { equals: 'invalid' } } } },
      }),
    ).rejects.toThrow('items.contains.rank.equals')
  })

  test('should match a localized row with locale all', async ({ payload }) => {
    const article = await payload.create({
      collection: accessJoinArticlesSlug,
      data: { localizedItems: [{ heading: 'Welcome' }] },
      locale: 'en',
      overrideAccess: true,
    })

    await payload.update({
      collection: accessJoinArticlesSlug,
      id: article.id,
      data: { localizedItems: [{ heading: 'Bienvenido' }] },
      locale: 'es',
      overrideAccess: true,
    })

    const { docs } = await payload.find({
      collection: accessJoinArticlesSlug,
      locale: 'all',
      overrideAccess: true,
      where: { localizedItems: { contains: { heading: { equals: 'Bienvenido' } } } },
    })

    expect(docs.map(({ id }) => id)).toEqual([article.id])
  })
})
