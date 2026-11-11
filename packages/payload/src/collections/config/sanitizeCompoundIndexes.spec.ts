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
    {
      name: 'items',
      type: 'array',
      fields: [
        { name: 'code', type: 'text' },
        { name: 'gate', type: 'text' },
        { name: 'details', type: 'group', fields: [{ name: 'code', type: 'text' }] },
      ],
    },
    {
      name: 'content',
      type: 'blocks',
      blocks: [{ slug: 'item', fields: [{ name: 'code', type: 'text' }] }],
    },
  ],
})

describe('compound index existence filters', () => {
  test.each(['items.code', 'items.details.code', 'content.item.code'])(
    'should reject a unique filtered index with an indexed path inside an array or block: %s',
    (path) => {
      expect(() =>
        sanitizeCompoundIndexes({
          fields,
          indexes: [{ fields: ['tenant', path], requireExists: ['items.gate'], unique: true }],
        }),
      ).toThrow(
        `Unique compound indexes with requireExists cannot index paths within arrays or blocks. Path: ${path}`,
      )
    },
  )

  test('should allow array paths used only in the existence filter', () => {
    expect(
      sanitizeCompoundIndexes({
        fields,
        indexes: [{ fields: ['tenant'], requireExists: ['items.gate'], unique: true }],
      })[0]?.requireExists,
    ).toEqual([{ localizedPath: 'items.gate', path: 'items.gate', pathHasLocalized: false }])
  })

  test.each([
    { fields: ['tenant', 'items.code'], unique: true },
    { fields: ['tenant', 'items.code'], requireExists: [], unique: true },
    { fields: ['tenant', 'items.code'], requireExists: ['items.gate'], unique: false },
  ])('should preserve existing multikey configurations: %j', (index) => {
    expect(sanitizeCompoundIndexes({ fields, indexes: [index] })[0]?.fields[1]?.path).toBe(
      'items.code',
    )
  })

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
