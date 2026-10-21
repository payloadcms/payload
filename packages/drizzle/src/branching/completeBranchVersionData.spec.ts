import type { FlattenedField } from 'payload'

import { describe, expect, it } from 'vitest'

import { completeBranchVersionData } from './completeBranchVersionData.js'

describe('complete branch version replacement', () => {
  it('should clear omitted scalars and locale values without merging JSON content', () => {
    const fields = [
      { name: 'title', type: 'text', localized: true },
      { name: 'metadata', type: 'json' },
      { name: 'old', type: 'text' },
    ] as FlattenedField[]

    expect(
      completeBranchVersionData({
        fields,
        previous: { title: { en: 'old', fr: 'ancien' }, metadata: { old: true }, old: 'remove' },
        replacement: { title: { en: 'new' }, metadata: { new: true } },
      }),
    ).toEqual({ title: { en: 'new', fr: null }, metadata: { new: true }, old: null })
  })

  it('should clear omitted group descendants and arrays', () => {
    const fields = [
      {
        name: 'details',
        type: 'group',
        flattenedFields: [
          { name: 'label', type: 'text' },
          { name: 'rows', type: 'array', flattenedFields: [] },
        ],
      },
    ] as FlattenedField[]

    expect(
      completeBranchVersionData({
        fields,
        previous: { details: { label: 'old', rows: [{ id: 'row' }] } },
        replacement: {},
      }),
    ).toEqual({ details: { label: null, rows: [] } })
  })
})
