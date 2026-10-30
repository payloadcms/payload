import type { FlattenedField, Payload } from 'payload'

import { describe, expect, it } from 'vitest'

import { buildSearchParam } from './buildSearchParams.js'

const fields = [{ name: 'title', type: 'text' }] as FlattenedField[]
const dateOnlyFields = [{ name: 'publishedOn', type: 'date' }] as FlattenedField[]
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
  it('should match the entire calendar day when a date-only field equals a day', async () => {
    const result = await buildSearchParam({
      fields: dateOnlyFields,
      incomingPath: 'publishedOn',
      operator: 'equals',
      parentIsLocalized: false,
      payload,
      val: '2026-02-12T12:00:00.000Z',
    })

    expect(result).toEqual({
      path: 'publishedOn',
      value: {
        $gte: new Date('2026-02-12T00:00:00.000Z'),
        $lt: new Date('2026-02-13T00:00:00.000Z'),
      },
    })
  })

  it('should preserve the configured calendar day from offset-bearing values', async () => {
    const result = await buildSearchParam({
      fields: dateOnlyWithTimezoneFields,
      incomingPath: 'publishedOn',
      operator: 'equals',
      parentIsLocalized: false,
      payload,
      val: '2026-06-15T00:00:00+01:00',
    })

    expect(result).toEqual({
      path: 'publishedOn',
      value: {
        $gte: new Date('2026-06-14T23:00:00.000Z'),
        $lt: new Date('2026-06-15T23:00:00.000Z'),
      },
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
