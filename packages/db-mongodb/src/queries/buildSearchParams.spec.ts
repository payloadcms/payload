import type { FlattenedField, Payload } from 'payload'

import { describe, expect, it } from 'vitest'

import { buildSearchParam } from './buildSearchParams.js'

const fields = [{ name: 'title', type: 'text' }] as FlattenedField[]
const dateOnlyWithTimezoneFields = [
  {
    name: 'publishedOn',
    timezone: { defaultTimezone: 'Europe/London' },
    type: 'date',
  },
] as FlattenedField[]

const payload = {
  config: {},
  collections: {},
  globals: {},
} as Payload

describe('buildSearchParam', () => {
  it('should match the configured calendar day when a date-only field equals a day', async () => {
    const result = await buildSearchParam({
      fields: dateOnlyWithTimezoneFields,
      incomingPath: 'publishedOn',
      operator: 'equals',
      parentIsLocalized: false,
      payload,
      val: '2026-03-29',
    })

    expect(result).toEqual({
      path: 'publishedOn',
      value: {
        $gte: new Date('2026-03-29T00:00:00.000Z'),
        $lt: new Date('2026-03-29T23:00:00.000Z'),
      },
    })
  })

  it('should preserve exact timestamp equality on a date-only field', async () => {
    const result = await buildSearchParam({
      fields: dateOnlyWithTimezoneFields,
      incomingPath: 'publishedOn',
      operator: 'equals',
      parentIsLocalized: false,
      payload,
      val: '2026-06-15T12:00:00.000Z',
    })

    expect(result).toEqual({
      path: 'publishedOn',
      value: { $eq: new Date('2026-06-15T12:00:00.000Z') },
    })
  })

  it('should start greater-than after the configured calendar day', async () => {
    const result = await buildSearchParam({
      fields: dateOnlyWithTimezoneFields,
      incomingPath: 'publishedOn',
      operator: 'greater_than',
      parentIsLocalized: false,
      payload,
      val: '2026-03-29',
    })

    expect(result).toEqual({
      path: 'publishedOn',
      value: { $gte: new Date('2026-03-29T23:00:00.000Z') },
    })
  })

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
