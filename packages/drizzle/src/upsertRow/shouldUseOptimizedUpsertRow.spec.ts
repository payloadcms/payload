import type { FlattenedField } from 'payload'

import { describe, expect, it } from 'vitest'

import { shouldUseOptimizedUpsertRow } from './shouldUseOptimizedUpsertRow.js'

const fields = [
  { name: 'title', type: 'text', localized: true },
  {
    name: 'localizedGroup',
    type: 'group',
    flattenedFields: [{ name: 'items', type: 'array', flattenedFields: [] }],
    localized: true,
  },
] as unknown as FlattenedField[]

describe('shouldUseOptimizedUpsertRow', () => {
  it('should allow localized columns', () => {
    expect(shouldUseOptimizedUpsertRow({ data: { title: { en: 'title' } }, fields })).toBe(true)
  })

  it('should not allow localized groups', () => {
    expect(
      shouldUseOptimizedUpsertRow({ data: { localizedGroup: { en: { items: [] } } }, fields }),
    ).toBe(false)
  })
})
