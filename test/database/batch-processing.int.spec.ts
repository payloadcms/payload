import type { PayloadRequest } from 'payload'

import { expect } from 'vitest'

import { test } from '../__helpers/int/vitest.js'
import { postsSlug } from './shared.js'

test.suite('Database batch processing', { config: './config.ts' }, () => {
  test('should execute mixed operations and return ordered storage outcomes', async ({
    payload,
  }) => {
    const postToUpdate = await payload.create({
      collection: postsSlug,
      data: { title: 'update me' },
      overrideAccess: true,
    })
    const postToDelete = await payload.create({
      collection: postsSlug,
      data: { title: 'delete me' },
      overrideAccess: true,
    })
    const req = { payload } as PayloadRequest

    const results = await payload.db.batchProcessing({
      batchSize: 2,
      operations: [
        {
          args: {
            collection: postsSlug,
            data: { title: 'created in batch' },
            returning: false,
          },
          operation: 'create',
        },
        {
          args: {
            id: postToUpdate.id,
            collection: postsSlug,
            data: { title: 'updated in batch' },
            returning: false,
          },
          operation: 'updateOne',
        },
        {
          args: {
            collection: postsSlug,
            data: { title: 'never applied' },
            returning: false,
            where: { title: { equals: 'not present' } },
          },
          operation: 'updateOne',
        },
        {
          args: {
            collection: postsSlug,
            returning: false,
            where: { id: { equals: postToDelete.id } },
          },
          operation: 'deleteOne',
        },
      ],
      req,
    })

    expect(results).toEqual([
      {
        documentID: expect.anything(),
        index: 0,
        operation: 'create',
        status: 'succeeded',
      },
      {
        documentID: postToUpdate.id,
        index: 1,
        operation: 'updateOne',
        status: 'succeeded',
      },
      {
        index: 2,
        operation: 'updateOne',
        status: 'noMatch',
      },
      {
        documentID: postToDelete.id,
        index: 3,
        operation: 'deleteOne',
        status: 'succeeded',
      },
    ])

    const storedPosts = await payload.find({
      collection: postsSlug,
      limit: 0,
      overrideAccess: true,
      where: {
        title: {
          in: ['created in batch', 'updated in batch', 'delete me', 'never applied'],
        },
      },
    })

    expect(storedPosts.docs.map(({ title }) => title).sort()).toEqual([
      'created in batch',
      'updated in batch',
    ])
  })
})
