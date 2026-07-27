import type { FlattenedField, PayloadRequest } from 'payload'

import { describe, expect, it, vi } from 'vitest'

import { applyFieldHooks } from './applyFieldHooks.js'
import { getExportFieldFunctions } from './getExportFieldFunctions.js'

const mockReq = {
  payload: {
    logger: {
      error: vi.fn(),
    },
  },
} as unknown as PayloadRequest

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

describe('hasMany polymorphic CSV columns', () => {
  it('should pin columns to the source index when an earlier relationship is orphaned', () => {
    const fields: FlattenedField[] = [
      {
        name: 'rel',
        type: 'relationship',
        hasMany: true,
        relationTo: ['posts', 'users'],
      } as unknown as FlattenedField,
    ]

    const result = applyFieldHooks({
      type: 'beforeExport',
      // Exports populate at depth 1, so `value: null` is an orphaned reference —
      // the target doc was deleted out from under it.
      data: {
        rel: [
          { relationTo: 'users', value: null },
          { relationTo: 'posts', value: 'p1' },
        ],
      },
      fieldHooks: getExportFieldFunctions({ fields }),
      fields,
      format: 'csv',
      operation: 'export',
      req: mockReq,
    })

    // The surviving entry stays at index 1 — shifting it to 0 would silently
    // rewrite column names for every consumer of the CSV.
    expect(result).toEqual({
      rel: null,
      rel_1_id: 'p1',
      rel_1_relationTo: 'posts',
    })
  })
})
