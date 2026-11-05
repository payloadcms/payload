import type { FlattenedField, Payload } from 'payload'

import { describe, expect, it } from 'vitest'

import { buildSearchParam } from './buildSearchParams.js'

const fields = [{ name: 'title', type: 'text' }] as FlattenedField[]

const payload = {
  config: {},
  collections: {},
  globals: {},
} as Payload

describe('buildSearchParam', () => {
  for (const operator of ['contains', 'like', 'not_like'] as const) {
    it(`rejects object values for ${operator}`, async () => {
      await expect(
        buildSearchParam({
          fields,
          incomingPath: 'title',
          operator,
          parentIsLocalized: false,
          payload,
          val: { pattern: 'title' },
        }),
      ).rejects.toThrow(`Invalid value for "${operator}"`)
    })
  }

  it('rejects arrays containing object values', async () => {
    await expect(
      buildSearchParam({
        fields,
        incomingPath: 'title',
        operator: 'like',
        parentIsLocalized: false,
        payload,
        val: [{ pattern: 'title' }],
      }),
    ).rejects.toThrow('Invalid value for "like"')
  })
})
