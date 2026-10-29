import { expect } from 'vitest'

import { test } from '../__helpers/int/vitest.js'
import { postsSlug } from './shared.js'

test.suite('Conditional database updates', { config: './config.ts' }, () => {
  test.options(
    'should update different matching documents when atomic updates run concurrently',
    { db: 'drizzle' },
    async ({ payload }) => {
      const matchingPosts = await Promise.all(
        Array.from({ length: 2 }, () =>
          payload.create({
            collection: postsSlug,
            data: { title: 'pending' },
            overrideAccess: true,
          }),
        ),
      )

      const results = await Promise.all(
        matchingPosts.map(() =>
          payload.db.updateOne({
            collection: postsSlug,
            data: { title: 'processing' },
            options: { atomic: true },
            where: { title: { equals: 'pending' } },
          }),
        ),
      )

      expect(results.every(Boolean)).toBe(true)
      expect(new Set(results.map(({ id }) => id))).toEqual(
        new Set(matchingPosts.map(({ id }) => id)),
      )
    },
  )

  test.options(
    'should update at most one document when the predicate matches multiple documents',
    { db: 'drizzle' },
    async ({ payload }) => {
      const matchingPosts = await Promise.all([
        payload.create({
          collection: postsSlug,
          data: { title: 'pending' },
          overrideAccess: true,
        }),
        payload.create({
          collection: postsSlug,
          data: { title: 'pending' },
          overrideAccess: true,
        }),
      ])

      const result = await payload.db.updateOne({
        collection: postsSlug,
        data: { title: 'processing' },
        options: { atomic: true },
        where: { title: { equals: 'pending' } },
      })
      const updatedPosts = await payload.find({
        collection: postsSlug,
        limit: 0,
        overrideAccess: true,
        where: { id: { in: matchingPosts.map(({ id }) => id) } },
      })

      expect(result).toBeTruthy()
      expect(updatedPosts.docs.filter(({ title }) => title === 'processing')).toHaveLength(1)
      expect(updatedPosts.docs.filter(({ title }) => title === 'pending')).toHaveLength(1)
    },
  )
})
