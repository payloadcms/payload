import { assert } from 'ts-essentials'
import { describe, it, expect } from 'vitest'
import type { SanitizedConfig } from '../config/types.js'
import { flattenAllFields } from './flattenAllFields.js'
import { classifyDateFilterInput } from './dateOnlyFilter.js'
import { getFieldByPath } from './getFieldByPath.js'
import { getDateOnlyComparison } from './getDateOnlyComparison.js'
import { resolveDateFilterPlan } from './resolveDateFilterPlan.js'
import type {
  FlattenedArrayField,
  FlattenedField,
  FlattenedGroupField,
} from '../fields/config/types.js'

const fields = flattenAllFields({
  fields: [
    {
      type: 'text',
      name: 'text',
    },
    {
      type: 'text',
      name: 'textLocalized',
      localized: true,
    },
    {
      type: 'array',
      name: 'array',
      fields: [
        {
          name: 'text',
          type: 'text',
        },
        {
          name: 'textLocalized',
          localized: true,
          type: 'text',
        },
        {
          name: 'group',
          type: 'group',
          fields: [
            {
              name: 'text',
              type: 'text',
            },
          ],
        },
      ],
    },
    {
      type: 'tabs',
      tabs: [
        {
          name: 'tab',
          fields: [
            {
              type: 'array',
              name: 'localizedArray',
              localized: true,
              fields: [
                {
                  name: 'text',
                  type: 'text',
                },
              ],
            },
          ],
        },
      ],
    },
    {
      type: 'blocks',
      name: 'blocks',
      blocks: [
        {
          slug: 'block1',
          fields: [
            {
              name: 'text1',
              type: 'text',
            },
          ],
        },
        {
          slug: 'block2',
          fields: [
            {
              name: 'text2',
              type: 'text',
            },
          ],
        },
      ],
    },
  ],
})

describe('getFieldByPath', () => {
  it('asserts getFieldByPath', () => {
    const assert_1 = getFieldByPath({ fields, path: 'text' })
    assert(assert_1)
    expect(assert_1.field).toBe(fields[0])
    expect(assert_1.pathHasLocalized).toBe(false)

    const assert_2 = getFieldByPath({ fields, path: 'textLocalized' })
    assert(assert_2)
    expect(assert_2.field).toBe(fields[1])
    expect(assert_2.pathHasLocalized).toBe(true)
    expect(assert_2.localizedPath).toBe('textLocalized.<locale>')

    const arrayField = fields[2] as FlattenedArrayField
    const assert_3 = getFieldByPath({ fields, path: 'array' })
    assert(assert_3)
    expect(assert_3.field).toBe(arrayField)
    expect(assert_3.pathHasLocalized).toBe(false)

    const assert_4 = getFieldByPath({ fields, path: 'array.text' })
    assert(assert_4)
    expect(assert_4.field).toBe(arrayField.flattenedFields[0])
    expect(assert_4.pathHasLocalized).toBe(false)

    const assert_5 = getFieldByPath({ fields, path: 'array.textLocalized' })
    assert(assert_5)
    expect(assert_5.field).toBe(arrayField.flattenedFields[1])
    expect(assert_5.pathHasLocalized).toBe(true)
    expect(assert_5.localizedPath).toBe('array.textLocalized.<locale>')

    const groupWithinArray = arrayField.flattenedFields[2] as FlattenedGroupField
    const assert_6 = getFieldByPath({ fields, path: 'array.group.text' })
    assert(assert_6)
    expect(assert_6.field).toBe(groupWithinArray.flattenedFields[0])
    expect(assert_6.pathHasLocalized).toBe(false)

    const assert_7 = getFieldByPath({ fields, path: 'tab.localizedArray.text' })
    assert(assert_7)
    expect(assert_7.field).toBe((fields[3] as any).flattenedFields[0].flattenedFields[0])
    expect(assert_7.pathHasLocalized).toBe(true)
    expect(assert_7.localizedPath).toBe('tab.localizedArray.<locale>.text')
  })

  it('gets field nested within block', () => {
    const fieldInBlock = getFieldByPath({ fields, path: 'blocks.block2.text2' })
    expect(fieldInBlock?.field).toBeDefined()

    const sourceField = (fields[4] as any).blocks?.[1].flattenedFields?.[0]
    expect(sourceField).toBeDefined()
    expect(fieldInBlock?.field).toBe(sourceField)
  })
})

describe('date filter resolution', () => {
  const config = {
    admin: { timezones: { defaultTimezone: 'UTC' } },
    blocks: [],
    collections: [],
    localization: false,
  } as unknown as SanitizedConfig

  it('should distinguish calendar days from exact timestamps without guessing from noon UTC', () => {
    expect(classifyDateFilterInput({ operator: 'equals', value: '2026-06-15' })).toEqual({
      kind: 'calendarDay',
      serialized: '2026-06-15',
      value: { day: 15, month: 6, year: 2026 },
    })
    expect(
      classifyDateFilterInput({ operator: 'equals', value: '2026-06-15T12:00:00.000Z' }),
    ).toEqual({ kind: 'instant', value: '2026-06-15T12:00:00.000Z' })
    expect(() => classifyDateFilterInput({ operator: 'equals', value: '2026-02-30' })).toThrow(
      '2026-02-30',
    )
  })

  it.each([
    ['equals', ['greater_than_equal', 'less_than'], '2026-06-14T18:15:00.000Z'],
    ['not_equals', ['less_than', 'greater_than_equal'], '2026-06-14T18:15:00.000Z'],
    ['greater_than', ['greater_than_equal'], '2026-06-15T18:15:00.000Z'],
    ['greater_than_equal', ['greater_than_equal'], '2026-06-14T18:15:00.000Z'],
    ['less_than', ['less_than'], '2026-06-14T18:15:00.000Z'],
    ['less_than_equal', ['less_than'], '2026-06-15T18:15:00.000Z'],
  ] as const)(
    'should map %s to calendar-day boundaries',
    (operator, expectedOperators, expectedBoundary) => {
      const comparison = getDateOnlyComparison({
        date: '2026-06-15',
        operator,
        timezone: '+05:45',
      })

      expect(comparison?.constraints.map(({ operator }) => operator)).toEqual(expectedOperators)
      expect(comparison?.constraints[0]?.value).toEqual(new Date(expectedBoundary))
    },
  )

  it('should make equality empty for a wholly skipped civil day', () => {
    const comparison = getDateOnlyComparison({
      date: '2011-12-30',
      operator: 'equals',
      timezone: 'Pacific/Apia',
    })

    expect(comparison?.constraints[0]?.value).toEqual(comparison?.constraints[1]?.value)
  })

  it('should resolve every compatible block date target', () => {
    const fields = flattenAllFields({
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
              slug: 'event',
            },
            {
              fields: [
                {
                  name: 'date',
                  timezone: { defaultTimezone: 'Europe/London' },
                  type: 'date',
                },
              ],
              slug: 'deadline',
            },
          ],
          localized: true,
          name: 'content',
          type: 'blocks',
        },
      ],
    })
    const plan = resolveDateFilterPlan({
      config: { ...config, localization: { localeCodes: ['en', 'es'] } } as SanitizedConfig,
      fields,
      locale: 'en',
      operator: 'equals',
      parentIsLocalized: false,
      path: 'content.date',
      value: '2026-06-15',
    })

    expect(plan?.targets).toHaveLength(2)
    expect(plan?.timezone).toBe('Europe/London')
    expect(plan?.targets.map(({ lineage }) => lineage[0]?.blockSlug)).toEqual(['event', 'deadline'])
    expect(plan?.targets[0]?.lineage.map(({ name }) => name)).toEqual(['content', 'date'])
    expect(plan?.targets[0]?.lineage[0]?.locale).toBe('en')
  })

  it('should reject incompatible block targets instead of selecting the first', () => {
    const fields = flattenAllFields({
      fields: [
        {
          blocks: [
            {
              fields: [{ name: 'date', timezone: { defaultTimezone: 'UTC' }, type: 'date' }],
              slug: 'utcEvent',
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

    expect(() =>
      resolveDateFilterPlan({
        config,
        fields,
        operator: 'equals',
        parentIsLocalized: false,
        path: 'content.date',
        value: '2026-06-15',
      }),
    ).toThrow('content.date')
  })

  it('should preserve an explicit locale on a localized date inside blocks', () => {
    const fields = flattenAllFields({
      fields: [
        {
          blocks: [
            {
              fields: [{ localized: true, name: 'date', type: 'date' }],
              slug: 'event',
            },
          ],
          name: 'content',
          type: 'blocks',
        },
      ],
    })
    const plan = resolveDateFilterPlan({
      config: { ...config, localization: { localeCodes: ['en', 'es'] } } as SanitizedConfig,
      fields,
      locale: 'en',
      operator: 'equals',
      parentIsLocalized: false,
      path: 'content.date.es',
      value: '2026-06-15',
    })

    expect(plan?.targets[0]?.lineage[1]?.locale).toBe('es')
  })

  it('should preserve independent locales across a relationship path', () => {
    const relatedFields = flattenAllFields({
      fields: [{ localized: true, name: 'date', type: 'date' }],
    })
    const relationshipFields = flattenAllFields({
      fields: [
        {
          localized: true,
          name: 'event',
          relationTo: 'events',
          type: 'relationship',
        },
      ],
    })
    const relationshipConfig = {
      ...config,
      collections: [{ flattenedFields: relatedFields, slug: 'events' }],
      localization: { localeCodes: ['en', 'es'] },
    } as SanitizedConfig
    const plan = resolveDateFilterPlan({
      config: relationshipConfig,
      fields: relationshipFields,
      locale: 'en',
      operator: 'equals',
      parentIsLocalized: false,
      path: 'event.es.date.en',
      value: '2026-06-15',
    })

    expect(plan?.targets[0]?.lineage).toEqual([
      expect.objectContaining({ locale: 'es', name: 'event' }),
      expect.objectContaining({ locale: 'en', name: 'date' }),
    ])
    expect(plan?.requestLocale).toBe('en')
  })

  it('should follow existing monomorphic relationships but not unqualified polymorphic paths', () => {
    const relatedFields = flattenAllFields({
      fields: [{ name: 'date', type: 'date' }],
    })
    const relationshipFields = flattenAllFields({
      fields: [
        { name: 'event', relationTo: 'events', type: 'relationship' },
        { name: 'subject', relationTo: ['events', 'pages'], type: 'relationship' },
      ],
    })
    const relationshipConfig = {
      ...config,
      collections: [{ flattenedFields: relatedFields, slug: 'events' }],
    } as SanitizedConfig
    const resolve = (path: string) =>
      resolveDateFilterPlan({
        config: relationshipConfig,
        fields: relationshipFields,
        operator: 'equals',
        parentIsLocalized: false,
        path,
        value: '2026-06-15',
      })

    expect(resolve('event.date')?.targets[0]?.lineage).toEqual([
      expect.objectContaining({ collectionSlug: 'events', name: 'event', type: 'relationship' }),
      expect.objectContaining({ name: 'date', type: 'date' }),
    ])
    expect(resolve('subject.date')).toBeUndefined()
  })

  it('should reject a path shared by date and non-date block fields', () => {
    const fields = flattenAllFields({
      fields: [
        {
          blocks: [
            { fields: [{ name: 'value', type: 'date' }], slug: 'dated' },
            { fields: [{ name: 'value', type: 'text' }], slug: 'text' },
          ],
          name: 'content',
          type: 'blocks',
        },
      ],
    }) as FlattenedField[]

    expect(() =>
      resolveDateFilterPlan({
        config,
        fields,
        operator: 'equals',
        parentIsLocalized: false,
        path: 'content.value',
        value: '2026-06-15',
      }),
    ).toThrow('content.value')

    expect(
      resolveDateFilterPlan({
        config,
        fields,
        operator: 'equals',
        parentIsLocalized: false,
        path: 'content.value',
        value: '2026-06-15T12:00:00.000Z',
      }),
    ).toBeUndefined()
  })
})
