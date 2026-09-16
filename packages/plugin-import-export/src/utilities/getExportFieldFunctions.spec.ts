import type { FlattenedField, PayloadRequest } from 'payload'

import { describe, expect, it, vi } from 'vitest'

import { applyFieldHooks } from './applyFieldHooks.js'
import { flattenObject } from './flattenObject.js'
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

    // Real CSV export never calls applyFieldHooks — it goes through flattenObject,
    // which (unlike applyFieldHooks) drops the key entirely when an array hook
    // returns null instead of writing a literal `rel: null`.
    const result = flattenObject({
      // Exports populate at depth 1, so `value: null` is an orphaned reference —
      // the target doc was deleted out from under it.
      data: {
        rel: [
          { relationTo: 'users', value: null },
          { relationTo: 'posts', value: 'p1' },
        ],
      },
      exportFieldHooks: getExportFieldFunctions({ fields }),
      format: 'csv',
      req: mockReq,
    })

    // The surviving entry stays at index 1 — shifting it to 0 would silently
    // rewrite column names for every consumer of the CSV. There is no bare `rel`
    // column: a hasMany field never gets one, orphaned or not.
    expect(result).toEqual({
      rel_1_id: 'p1',
      rel_1_relationTo: 'posts',
    })
  })
})

describe('dangling references in JSON exports', () => {
  it('should drop an orphaned hasMany entry', () => {
    const fields: FlattenedField[] = [
      {
        name: 'rel',
        type: 'relationship',
        hasMany: true,
        relationTo: 'posts',
      } as unknown as FlattenedField,
    ]

    const result = applyFieldHooks({
      type: 'beforeExport',
      // Population resolves a soft-deleted target to null.
      data: { rel: [null, 'p1'] },
      fieldHooks: getExportFieldFunctions({ fields }),
      fields,
      format: 'json',
      operation: 'export',
      req: mockReq,
    })

    expect(result).toEqual({ rel: ['p1'] })
  })

  it('should drop an orphaned hasMany polymorphic entry', () => {
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
      data: {
        rel: [
          { relationTo: 'users', value: null },
          { relationTo: 'posts', value: 'p1' },
        ],
      },
      fieldHooks: getExportFieldFunctions({ fields }),
      fields,
      format: 'json',
      operation: 'export',
      req: mockReq,
    })

    expect(result).toEqual({
      rel: [{ relationTo: 'posts', value: 'p1' }],
    })
  })

  it('should clear an orphaned single polymorphic reference', () => {
    const fields: FlattenedField[] = [
      {
        name: 'rel',
        type: 'relationship',
        relationTo: ['posts', 'users'],
      } as unknown as FlattenedField,
    ]

    const result = applyFieldHooks({
      type: 'beforeExport',
      data: { rel: { relationTo: 'posts', value: null } },
      fieldHooks: getExportFieldFunctions({ fields }),
      fields,
      format: 'json',
      operation: 'export',
      req: mockReq,
    })

    expect(result).toEqual({ rel: null })
  })

  it('should leave a shape it does not recognize untouched', () => {
    const fields: FlattenedField[] = [
      {
        name: 'rel',
        type: 'relationship',
        relationTo: ['posts', 'users'],
      } as unknown as FlattenedField,
    ]

    const result = applyFieldHooks({
      type: 'beforeExport',
      // Destroying a value this handler cannot interpret would lose data that a
      // custom beforeExport hook or a hand-edited file may depend on.
      data: { rel: { slug: 'not-a-relationship' } },
      fieldHooks: getExportFieldFunctions({ fields }),
      fields,
      format: 'json',
      operation: 'export',
      req: mockReq,
    })

    expect(result).toEqual({ rel: { slug: 'not-a-relationship' } })
  })
})
