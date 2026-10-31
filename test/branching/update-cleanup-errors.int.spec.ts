import { expect, vi } from 'vitest'

import { test } from '../__helpers/int/vitest.js'
import { databaseAdapterSupportsTransactions } from '../__helpers/shared/databaseAdapterCapabilities.js'
import { postsSlug } from './shared.js'

test.suite('Branching: update cleanup errors', { config: './config.ts' }, () => {
  test.options(
    'should preserve the operation error after rollback also reports a failure',
    {
      db: (adapter) => databaseAdapterSupportsTransactions({ adapter }),
    },
    async ({ payload }) => {
      const post = await payload.create({
        collection: postsSlug,
        data: { title: 'Original' },
        overrideAccess: true,
      })
      const config = payload.collections[postsSlug].config
      const beforeChange = config.hooks.beforeChange
      const operationError = new Error('Original update failure')
      const rollbackError = new Error('Rollback reporting failure')
      const rollback = payload.db.rollbackTransaction.bind(payload.db)
      const rollbackSpy = vi
        .spyOn(payload.db, 'rollbackTransaction')
        .mockImplementationOnce(async (id) => {
          await rollback(id)
          throw rollbackError
        })

      config.hooks.beforeChange = [
        ...beforeChange,
        () => {
          throw operationError
        },
      ]

      try {
        await expect(
          payload.update({
            collection: postsSlug,
            id: post.id,
            data: { title: 'Changed' },
            overrideAccess: true,
          }),
        ).rejects.toBe(operationError)
        expect(rollbackSpy).toHaveBeenCalledOnce()
      } finally {
        config.hooks.beforeChange = beforeChange
        rollbackSpy.mockRestore()
      }
    },
  )
})
