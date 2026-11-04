import type { FlattenedField, Payload } from 'payload'

import { describe, expect, it } from 'vitest'
import { flattenAllFields } from 'payload/shared'

import { buildSearchParam } from './buildSearchParams.js'
import { parseParams } from './parseParams.js'

const fields = [{ name: 'title', type: 'text' }] as FlattenedField[]
const dateOnlyFields = flattenAllFields({
  fields: [
    {
      name: 'publishedOn',
      timezone: { defaultTimezone: 'Europe/London' },
      type: 'date',
    },
  ],
})
const accessControlledDateOnlyFields = flattenAllFields({
  fields: [
    { name: 'owner', type: 'text' },
    { name: 'isPublic', type: 'checkbox' },
    {
      name: 'publishedOn',
      timezone: { defaultTimezone: 'Europe/London' },
      type: 'date',
    },
  ],
})
const arrayDateOnlyFields = flattenAllFields({
  fields: [
    {
      fields: [{ name: 'date', type: 'date' }],
      name: 'events',
      type: 'array',
    },
  ],
})
const localizedArrayDateOnlyFields = flattenAllFields({
  fields: [
    {
      fields: [{ name: 'date', type: 'date' }],
      localized: true,
      name: 'events',
      type: 'array',
    },
  ],
})
const nestedArrayDateOnlyFields = flattenAllFields({
  fields: [
    {
      fields: [
        {
          fields: [{ name: 'date', type: 'date' }],
          name: 'sessions',
          type: 'array',
        },
      ],
      name: 'events',
      type: 'array',
    },
  ],
})
const blocksDateOnlyFields = flattenAllFields({
  fields: [
    {
      blocks: [
        {
          fields: [{ name: 'date', type: 'date' }],
          slug: 'event',
        },
      ],
      name: 'content',
      type: 'blocks',
    },
  ],
})
const ambiguousBlocksDateOnlyFields = flattenAllFields({
  fields: [
    {
      blocks: [
        {
          fields: [
            {
              admin: { date: { pickerAppearance: 'dayAndTime' } },
              name: 'date',
              timezone: { defaultTimezone: 'America/New_York' },
              type: 'date',
            },
          ],
          slug: 'newYorkEvent',
        },
        {
          fields: [
            {
              name: 'date',
              timezone: { defaultTimezone: 'Europe/London' },
              type: 'date',
            },
          ],
          slug: 'londonEvent',
        },
      ],
      name: 'content',
      type: 'blocks',
    },
  ],
})
const duplicateBlocksDateOnlyFields = flattenAllFields({
  fields: [
    {
      blocks: [
        {
          fields: [
            {
              name: 'date',
              timezone: { defaultTimezone: 'Europe/London' },
              type: 'date',
            },
          ],
          slug: 'firstEvent',
        },
        {
          fields: [
            {
              name: 'date',
              timezone: { defaultTimezone: 'Europe/London' },
              type: 'date',
            },
          ],
          slug: 'secondEvent',
        },
      ],
      name: 'content',
      type: 'blocks',
    },
  ],
})
const mixedBlocksDateOnlyFields = flattenAllFields({
  fields: [
    {
      blocks: [
        {
          fields: [{ name: 'date', type: 'text' }],
          slug: 'textEvent',
        },
        {
          fields: [{ name: 'date', type: 'date' }],
          slug: 'datedEvent',
        },
      ],
      name: 'content',
      type: 'blocks',
    },
  ],
})
const payload = {
  config: {},
  collections: {},
  globals: {},
} as Payload

describe('buildSearchParam', () => {
  it('should execute date-only equals as the configured calendar day', async () => {
    await expect(
      buildSearchParam({
        fields: dateOnlyFields,
        incomingPath: 'publishedOn',
        operator: 'equals',
        parentIsLocalized: false,
        payload,
        val: '2026-03-29',
      }),
    ).resolves.toEqual({
      path: 'publishedOn',
      value: {
        $gte: new Date('2026-03-29T00:00:00.000Z'),
        $lt: new Date('2026-03-29T23:00:00.000Z'),
      },
    })
  })

  it('should preserve exact timestamp equality on a date-only field', async () => {
    await expect(
      buildSearchParam({
        fields: dateOnlyFields,
        incomingPath: 'publishedOn',
        operator: 'equals',
        parentIsLocalized: false,
        payload,
        val: '2026-03-29T12:00:00.000Z',
      }),
    ).resolves.toEqual({
      path: 'publishedOn',
      value: { $eq: new Date('2026-03-29T12:00:00.000Z') },
    })
  })

  it('should start greater-than after the configured calendar day', async () => {
    await expect(
      buildSearchParam({
        fields: dateOnlyFields,
        incomingPath: 'publishedOn',
        operator: 'greater_than',
        parentIsLocalized: false,
        payload,
        val: '2026-03-29',
      }),
    ).resolves.toEqual({
      path: 'publishedOn',
      value: { $gte: new Date('2026-03-29T23:00:00.000Z') },
    })
  })

  it('should keep date-only not_equals alongside an existing or condition', async () => {
    await expect(
      parseParams({
        fields: accessControlledDateOnlyFields,
        parentIsLocalized: false,
        payload,
        where: {
          or: [{ owner: { equals: 'u1' } }, { isPublic: { equals: true } }],
          publishedOn: { not_equals: '2026-06-15' },
        },
      }),
    ).resolves.toEqual({
      $or: [{ owner: { $eq: 'u1' } }, { isPublic: { $eq: true } }],
      publishedOn: {
        $not: {
          $gte: new Date('2026-06-14T23:00:00.000Z'),
          $lt: new Date('2026-06-15T23:00:00.000Z'),
        },
      },
    })
  })

  it('should bind date-only array bounds to the same array entry', async () => {
    await expect(
      buildSearchParam({
        fields: arrayDateOnlyFields,
        incomingPath: 'events.date',
        operator: 'equals',
        parentIsLocalized: false,
        payload,
        val: '2026-06-15',
      }),
    ).resolves.toEqual({
      path: 'events',
      value: {
        $elemMatch: {
          date: {
            $gte: new Date('2026-06-15T00:00:00.000Z'),
            $lt: new Date('2026-06-16T00:00:00.000Z'),
          },
        },
      },
    })
  })

  it('should preserve the locale when binding date-only array bounds', async () => {
    const localizedPayload = {
      ...payload,
      config: {
        localization: {
          defaultLocale: 'en',
          fallback: true,
          localeCodes: ['en', 'de'],
          locales: [{ code: 'en' }, { code: 'de' }],
        },
      },
    } as Payload

    await expect(
      buildSearchParam({
        fields: localizedArrayDateOnlyFields,
        incomingPath: 'events.date',
        locale: 'de',
        operator: 'equals',
        parentIsLocalized: false,
        payload: localizedPayload,
        val: '2026-06-15',
      }),
    ).resolves.toEqual({
      path: 'events.de',
      value: {
        $elemMatch: {
          date: {
            $gte: new Date('2026-06-15T00:00:00.000Z'),
            $lt: new Date('2026-06-16T00:00:00.000Z'),
          },
        },
      },
    })
  })

  it('should bind date-only bounds within every nested array', async () => {
    await expect(
      buildSearchParam({
        fields: nestedArrayDateOnlyFields,
        incomingPath: 'events.sessions.date',
        operator: 'equals',
        parentIsLocalized: false,
        payload,
        val: '2026-06-15',
      }),
    ).resolves.toEqual({
      path: 'events',
      value: {
        $elemMatch: {
          sessions: {
            $elemMatch: {
              date: {
                $gte: new Date('2026-06-15T00:00:00.000Z'),
                $lt: new Date('2026-06-16T00:00:00.000Z'),
              },
            },
          },
        },
      },
    })
  })

  it('should bind date-only bounds to the same block entry', async () => {
    await expect(
      buildSearchParam({
        fields: blocksDateOnlyFields,
        incomingPath: 'content.date',
        operator: 'equals',
        parentIsLocalized: false,
        payload,
        val: '2026-06-15',
      }),
    ).resolves.toEqual({
      path: 'content',
      value: {
        $elemMatch: {
          date: {
            $gte: new Date('2026-06-15T00:00:00.000Z'),
            $lt: new Date('2026-06-16T00:00:00.000Z'),
          },
        },
      },
    })
  })

  it('should reject an ambiguous date-only path across block configurations', async () => {
    await expect(
      buildSearchParam({
        fields: ambiguousBlocksDateOnlyFields,
        incomingPath: 'content.date',
        operator: 'equals',
        parentIsLocalized: false,
        payload,
        val: '2026-06-15',
      }),
    ).rejects.toThrow('content.date')
  })

  it('should lower compatible block date targets to one physical Mongo path', async () => {
    await expect(
      buildSearchParam({
        fields: duplicateBlocksDateOnlyFields,
        incomingPath: 'content.date',
        operator: 'equals',
        parentIsLocalized: false,
        payload,
        val: '2026-06-15',
      }),
    ).resolves.toEqual({
      path: 'content',
      value: {
        $elemMatch: {
          date: {
            $gte: new Date('2026-06-14T23:00:00.000Z'),
            $lt: new Date('2026-06-15T23:00:00.000Z'),
          },
        },
      },
    })
  })

  it('should reject a date path shared by date and non-date block fields', async () => {
    await expect(
      buildSearchParam({
        fields: mixedBlocksDateOnlyFields,
        incomingPath: 'content.date',
        operator: 'equals',
        parentIsLocalized: false,
        payload,
        val: '2026-06-15',
      }),
    ).rejects.toThrow('content.date')
  })

  it('should preserve exact timestamps across ambiguous block date configurations', async () => {
    await expect(
      buildSearchParam({
        fields: ambiguousBlocksDateOnlyFields,
        incomingPath: 'content.date',
        operator: 'equals',
        parentIsLocalized: false,
        payload,
        val: '2026-06-15T12:00:00.000Z',
      }),
    ).resolves.toEqual({
      path: 'content.date',
      value: { $eq: new Date('2026-06-15T12:00:00.000Z') },
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
