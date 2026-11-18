import { expect } from 'vitest'

import { test } from '../__helpers/int/vitest.js'

test.suite(
  'Sort documents without a value',
  { config: './config.ts', resetBetweenTests: false },
  () => {
    test.beforeAll(async ({ payloadInstance: payload }) => {
      for (const data of [
        { array: [{ number: 1 }], hasManyNumber: [1], number: 1, text: 'low' },
        { text: 'none' },
        { array: [{ number: 2 }], hasManyNumber: [2], number: 2, text: 'high' },
      ]) {
        await payload.create({ collection: 'posts', data, overrideAccess: true })
      }
    })

    for (const sort of ['-number', '-array.number', '-hasManyNumber']) {
      test(`should sort them last when sorting by ${sort}`, async ({ payload }) => {
        const posts = await payload.find({ collection: 'posts', overrideAccess: true, sort })

        expect(posts.docs.map((post) => post.text)).toEqual(['high', 'low', 'none'])
      })
    }
  },
)
