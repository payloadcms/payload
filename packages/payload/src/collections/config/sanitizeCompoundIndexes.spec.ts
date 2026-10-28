import { describe, expect, test } from 'vitest'

import { flattenAllFields } from '../../utilities/flattenAllFields.js'
import { sanitizeCompoundIndexes } from './sanitizeCompoundIndexes.js'

const fields = flattenAllFields({
  fields: [
    { name: 'tenant', type: 'text' },
    { name: 'slug', type: 'text', localized: true },
    {
      name: 'metadata',
      type: 'group',
      localized: true,
      fields: [{ name: 'code', type: 'text' }],
    },
  ],
})

describe('compound index existence filters', () => {
  test('should preserve paths and localization for fields outside the index keys', () => {
    expect(
      sanitizeCompoundIndexes({
        fields,
        indexes: [{ fields: ['tenant'], requireExists: ['slug', 'metadata.code'], unique: true }],
      })[0]?.requireExists,
    ).toEqual([
      { localizedPath: 'slug.<locale>', path: 'slug', pathHasLocalized: true },
      { localizedPath: 'metadata.<locale>.code', path: 'metadata.code', pathHasLocalized: true },
    ])
  })

  test('should reject an unknown filter field', () => {
    expect(() =>
      sanitizeCompoundIndexes({
        fields,
        indexes: [{ fields: ['tenant'], requireExists: ['missing'] }],
      }),
    ).toThrow('Field missing in requireExists was not found')
  })

  test('should leave indexes without an existence filter unchanged', () => {
    expect(
      sanitizeCompoundIndexes({ fields, indexes: [{ fields: ['tenant'] }] })[0],
    ).not.toHaveProperty('requireExists')
  })
})
