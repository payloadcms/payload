import { expect } from 'vitest'

import { test } from '../__helpers/int/vitest.js'
import { postsSlug } from './shared.js'

test.suite('Drizzle deleteOne', { config: './config.ts', db: 'drizzle' }, () => {
  for (const hasSelect of [false, true]) {
    test(`should return localized and related fields when deleting (select: ${hasSelect})`, async ({
      payload,
    }) => {
      const category = await payload.create({
        overrideAccess: true,
        collection: 'categories',
        data: { title: 'delete-related-category' },
      })
      const post = await payload.create({
        overrideAccess: true,
        collection: postsSlug,
        data: {
          title: 'delete-hydrated-post',
          localized: 'English text',
          polymorphicRelations: [{ relationTo: 'categories', value: category.id }],
        },
        depth: 0,
        locale: 'en',
      })
      const result = await payload.delete({
        overrideAccess: true,
        id: post.id,
        collection: postsSlug,
        depth: 0,
        locale: 'en',
        select: hasSelect ? { localized: true, polymorphicRelations: true } : undefined,
      })

      expect(result).toMatchObject({
        id: post.id,
        localized: 'English text',
        polymorphicRelations: [{ relationTo: 'categories', value: category.id }],
      })
    })
  }

  test('should resolve joined filters before hydrating and deleting the matched document', async ({
    payload,
  }) => {
    const category = await payload.create({
      overrideAccess: true,
      collection: 'categories',
      data: { title: 'delete-joined-category' },
    })
    const post = await payload.create({
      overrideAccess: true,
      collection: postsSlug,
      data: { title: 'delete-joined-post', category: category.id },
    })
    const result = await payload.db.deleteOne({
      collection: postsSlug,
      where: { 'category.title': { equals: 'delete-joined-category' } },
    })

    expect(result).toMatchObject({
      id: post.id,
      title: 'delete-joined-post',
      category: category.id,
    })
    await expect(
      payload.findByID({ overrideAccess: true, id: post.id, collection: postsSlug }),
    ).rejects.toMatchObject({
      status: 404,
    })
  })

  test('should preserve documents when the scalar filter does not match', async ({ payload }) => {
    const post = await payload.create({
      overrideAccess: true,
      collection: postsSlug,
      data: { title: 'keep-post' },
    })
    const result = await payload.db.deleteOne({
      collection: postsSlug,
      where: { title: { equals: 'missing-post' } },
    })

    expect(result).toBeNull()
    await expect(
      payload.findByID({ overrideAccess: true, id: post.id, collection: postsSlug }),
    ).resolves.toMatchObject({
      title: 'keep-post',
    })
  })
})
