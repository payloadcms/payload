import { describe, expect, it } from 'vitest'

import type { Field, SelectField } from './config/types.js'

import { mergeBaseFields } from './mergeBaseFields.js'

const baseStatusField: SelectField = {
  name: '_status',
  type: 'select',
  defaultValue: 'draft',
  options: [
    { label: 'Draft', value: 'draft' },
    { label: 'Published', value: 'published' },
  ],
}

const getStatusOptions = (fields: Field[]) =>
  (fields.find((field) => 'name' in field && field.name === '_status') as SelectField).options

describe('mergeBaseFields', () => {
  it('should not duplicate options redeclared with the same values', () => {
    const merged = mergeBaseFields(
      [
        {
          name: '_status',
          type: 'select',
          options: [
            { label: 'Draft', value: 'draft' },
            { label: 'Published', value: 'published' },
          ],
        },
      ],
      [baseStatusField],
    )

    expect(getStatusOptions(merged)).toEqual([
      { label: 'Draft', value: 'draft' },
      { label: 'Published', value: 'published' },
    ])
  })

  it('should keep base options when an override only adds a new option', () => {
    const merged = mergeBaseFields(
      [
        {
          name: '_status',
          type: 'select',
          options: [{ label: 'Archived', value: 'archived' }],
        },
      ],
      [baseStatusField],
    )

    expect(getStatusOptions(merged)).toEqual([
      { label: 'Draft', value: 'draft' },
      { label: 'Published', value: 'published' },
      { label: 'Archived', value: 'archived' },
    ])
  })

  it('should keep base options when an override passes an empty options array', () => {
    const merged = mergeBaseFields(
      [{ name: '_status', type: 'select', options: [] }],
      [baseStatusField],
    )

    expect(getStatusOptions(merged)).toEqual(baseStatusField.options)
  })

  it('should let an override relabel a base option without changing its position', () => {
    const merged = mergeBaseFields(
      [
        {
          name: '_status',
          type: 'select',
          options: ['published', { label: 'Work in progress', value: 'draft' }],
        },
      ],
      [baseStatusField],
    )

    expect(getStatusOptions(merged)).toEqual([
      { label: 'Work in progress', value: 'draft' },
      'published',
    ])
  })
})
