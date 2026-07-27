import { FlattenedField } from 'payload'

import { describe, expect, it } from 'vitest'

import { getExportFieldFunctions } from './getExportFieldFunctions.js'

describe('getExportFieldFunctions registration', () => {
  it('should not collide bare-key entries when two same-named fields with built-in handlers exist in different positions', () => {
    const fields: FlattenedField[] = [
      {
        name: 'groupA',
        type: 'group',
        flattenedFields: [{ name: 'data', type: 'json' } as FlattenedField],
      } as unknown as FlattenedField,
      {
        name: 'groupB',
        type: 'group',
        flattenedFields: [{ name: 'data', type: 'json' } as FlattenedField],
      } as unknown as FlattenedField,
    ]

    const result = getExportFieldFunctions({ fields })

    // Both nested paths must be registered (not overwritten by collision)
    expect(result['groupA_data']).toBeDefined()
    expect(result['groupB_data']).toBeDefined()

    // No bare-key fallback should exist for nested fields — that's the bug
    expect(result['data']).toBeUndefined()
  })

  it('should still register a top-level field at its name', () => {
    const fields: FlattenedField[] = [{ name: 'topLevelData', type: 'json' } as FlattenedField]

    const result = getExportFieldFunctions({ fields })

    expect(result['topLevelData']).toBeDefined()
  })
})

describe('relationship export handlers', () => {
  const buildField = (overrides: Record<string, unknown>): FlattenedField[] => [
    { name: 'rel', type: 'relationship', ...overrides } as unknown as FlattenedField,
  ]

  /**
   * Invokes the registered handler the way the export pipelines do and returns both
   * the hook's return value and whatever it wrote into the flat row.
   */
  const invoke = ({
    fields,
    format,
    value,
  }: {
    fields: FlattenedField[]
    format: 'csv' | 'json'
    value: unknown
  }) => {
    const entry = getExportFieldFunctions({ fields })['rel']
    const siblingData: Record<string, unknown> = {}

    const returned = (entry as { fn: (args: Record<string, unknown>) => unknown }).fn({
      columnName: 'rel',
      data: {},
      format,
      siblingData,
      siblingDoc: {},
      value,
    })

    return { returned, siblingData }
  }

  it('should leave an unresolvable single polymorphic value untouched for json but suppress it for csv', () => {
    const fields = buildField({ relationTo: ['posts', 'users'] })
    const value = { relationTo: 'posts', value: null }

    expect(invoke({ fields, format: 'json', value }).returned).toBeUndefined()
    expect(invoke({ fields, format: 'csv', value }).returned).toBeNull()
  })

  it('should drop unresolvable ids from a hasMany monomorphic json export', () => {
    const { returned } = invoke({
      fields: buildField({ hasMany: true, relationTo: 'posts' }),
      format: 'json',
      value: [{ id: 'p1' }, {}, 'p2'],
    })

    expect(returned).toEqual(['p1', 'p2'])
  })

  describe('hasMany polymorphic with an unresolvable entry', () => {
    const fields = buildField({ hasMany: true, relationTo: ['posts', 'users'] })
    const value = [
      { relationTo: 'users', value: null },
      { relationTo: 'posts', value: 'p1' },
    ]

    it('should keep csv columns pinned to the source index', () => {
      // The surviving entry stays at index 1 — shifting it to 0 would silently
      // rewrite column names for every consumer of the CSV.
      expect(invoke({ fields, format: 'csv', value }).siblingData).toEqual({
        rel_1_id: 'p1',
        rel_1_relationTo: 'posts',
      })
    })

    it('should drop the entry for json rather than leaving a hole', () => {
      expect(invoke({ fields, format: 'json', value }).returned).toEqual([
        { relationTo: 'posts', value: 'p1' },
      ])
    })
  })
})
