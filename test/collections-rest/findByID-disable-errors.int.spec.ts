import { NotFound } from 'payload'
import { expect } from 'vitest'

import { test } from '../__helpers/int/vitest.js'
import { postsSlug } from './config.js'

test.suite('Collections REST - findByID disableErrors', { config: './config.ts' }, () => {
  for (const [label, id] of [
    ['null', null],
    ['undefined', undefined],
    ['an empty string', ''],
  ] as const) {
    test(`should return null for ${label} id when disableErrors is true`, async ({ payload }) => {
      await expect(
        payload.findByID({
          id: id as unknown as string,
          collection: postsSlug,
          disableErrors: true,
          overrideAccess: true,
        }),
      ).resolves.toBeNull()
    })

    test(`should throw NotFound for ${label} id when disableErrors is not set`, async ({
      payload,
    }) => {
      await expect(
        payload.findByID({
          id: id as unknown as string,
          collection: postsSlug,
          overrideAccess: true,
        }),
      ).rejects.toBeInstanceOf(NotFound)
    })
  }
})
