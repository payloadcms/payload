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
