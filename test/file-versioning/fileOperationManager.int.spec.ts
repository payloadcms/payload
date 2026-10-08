/* eslint vitest/no-standalone-expect: ["error", { "additionalTestBlockFunctions": ["test"] }] -- Tests use the shared fixture wrapper. */
/* eslint @typescript-eslint/require-await: off -- Storage callbacks are asynchronous in production; these fakes record synchronous effects. */
import { expect } from 'vitest'

/* eslint-disable payload/no-relative-monorepo-imports -- The file operation manager is internal until upload writers use it. */
import {
  deferFileCleanup,
  runFileOperationPlan,
} from '../../packages/payload/src/uploads/fileVersioning/fileOperationManager.js'
/* eslint-enable payload/no-relative-monorepo-imports */
import { test } from '../__helpers/int/vitest.js'
import { mediaSlug } from './shared.js'

test.suite('File operation manager', { config: './config.ts' }, () => {
  test('should wait for a no-transaction outer update and its hooks', async ({ payload }) => {
    const doc = await payload.db.create({ collection: mediaSlug, data: { alt: 'before' } })
    const hooks = payload.collections[mediaSlug].config.hooks
    const originalBeforeChange = hooks.beforeChange
    const originalAfterChange = hooks.afterChange
    const events: string[] = []
    let shouldFail = true

    hooks.beforeChange = [
      ...(originalBeforeChange ?? []),
      async ({ data, req }) => {
        await runFileOperationPlan({
          req,
          stage: async () => {
            events.push('stage')
          },
          write: async () => {
            events.push('plan write')
            await deferFileCleanup({
              cleanup: async () => {
                events.push('cleanup')
              },
              req,
            })
          },
        })

        return data
      },
    ]
    hooks.afterChange = [
      ...(originalAfterChange ?? []),
      ({ doc: updated }) => {
        events.push('afterChange')
        if (shouldFail) {
          throw new Error('outer hook failed')
        }
        return updated
      },
    ]

    try {
      await expect(
        payload.update({
          id: doc.id,
          collection: mediaSlug,
          data: { alt: 'first attempt' },
          disableTransaction: true,
        }),
      ).rejects.toThrow('outer hook failed')

      expect(events).toEqual(['stage', 'plan write', 'afterChange'])

      shouldFail = false
      events.length = 0

      await payload.update({
        id: doc.id,
        collection: mediaSlug,
        data: { alt: 'second attempt' },
        disableTransaction: true,
      })

      expect(events).toEqual(['stage', 'plan write', 'afterChange', 'cleanup'])
    } finally {
      hooks.beforeChange = originalBeforeChange
      hooks.afterChange = originalAfterChange
    }
  })
})
