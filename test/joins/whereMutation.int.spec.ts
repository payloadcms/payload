/* eslint vitest/no-standalone-expect: ["error", { "additionalTestBlockFunctions": ["test"] }] -- Tests use the shared fixture wrapper. */
import type { Where } from 'payload'

import { expect } from 'vitest'

import { test } from '../__helpers/int/vitest.js'
import { categoriesSlug, postsSlug } from './shared.js'

test.suite('Join field where immutability', { config: './config.ts' }, () => {
  test('should preserve nested configured where across reads with different relationship access', async ({
    payload,
  }) => {
    const category = await payload.create({
      collection: categoriesSlug,
      data: { name: 'Join where immutability' },
      overrideAccess: true,
    })

    const firstAuthor = await payload.create({
      collection: 'users',
      data: { email: 'first-author@example.com', password: 'test' },
      overrideAccess: true,
    })

    const secondAuthor = await payload.create({
      collection: 'users',
      data: { email: 'second-author@example.com', password: 'test' },
      overrideAccess: true,
    })

    const firstPost = await payload.create({
      collection: postsSlug,
      data: { author: firstAuthor.id, category: category.id, title: 'First author post' },
      overrideAccess: true,
    })

    const secondPost = await payload.create({
      collection: postsSlug,
      data: { author: secondAuthor.id, category: category.id, title: 'Second author post' },
      overrideAccess: true,
    })

    const join = payload.collections[categoriesSlug].config.joins[postsSlug].find(
      ({ joinPath }) => joinPath === 'filtered',
    )!

    const usersConfig = payload.collections.users.config
    const originalWhere = join.field.where
    const originalReadAccess = usersConfig.access.read
    const configuredWhere: Where = {
      and: [{ 'author.email': { exists: true } }],
    }

    join.field.where = configuredWhere
    usersConfig.access.read = ({ req }) => ({
      id: { equals: req.context.readableAuthorID },
    })

    try {
      for (const { author, post } of [
        { author: firstAuthor, post: firstPost },
        { author: secondAuthor, post: secondPost },
      ]) {
        const result = await payload.findByID({
          id: category.id,
          collection: categoriesSlug,
          context: { readableAuthorID: author.id },
          depth: 0,
          overrideAccess: false,
          user: author,
        })

        expect(join.field.where).toEqual({
          and: [{ 'author.email': { exists: true } }],
        })
        expect(result.filtered.docs).toEqual([post.id])
      }
    } finally {
      join.field.where = originalWhere
      usersConfig.access.read = originalReadAccess
    }
  })
})
