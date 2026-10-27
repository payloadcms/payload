import type { ClientField } from 'payload'

import { describe, expect, it } from 'vitest'

import { getValidFieldOperators } from './field-types.js'

describe('getValidFieldOperators', () => {
  it.each(['relationship', 'upload'] as const)(
    'should offer membership operators for a hasMany %s with one target collection',
    (type) => {
      const field: ClientField = { name: 'related', type, hasMany: true, relationTo: 'posts' }

      const { validOperator, validOperators } = getValidFieldOperators({ field })

      expect(validOperators.map(({ value }) => value)).toEqual(['in', 'not_in', 'exists'])
      expect(validOperator).toBe('in')
    },
  )

  it.each(['relationship', 'upload'] as const)(
    'should retain equality operators for a single-value %s',
    (type) => {
      const field: ClientField = { name: 'related', type, relationTo: 'posts' }

      expect(getValidFieldOperators({ field, operator: 'not_equals' }).validOperator).toBe(
        'not_equals',
      )
    },
  )

  it.each(['relationship', 'upload'] as const)(
    'should preserve the current operators for a polymorphic %s',
    (type) => {
      const field: ClientField = {
        name: 'related',
        type,
        hasMany: true,
        relationTo: ['posts', 'pages'],
      }

      const { validOperators } = getValidFieldOperators({ field })

      expect(validOperators.map(({ value }) => value)).toEqual(
        type === 'relationship'
          ? ['equals', 'not_equals', 'exists']
          : ['equals', 'not_equals', 'in', 'not_in', 'exists'],
      )
    },
  )

  it('should retain equality operators for other hasMany fields', () => {
    const field: ClientField = { name: 'tags', type: 'text', hasMany: true }

    expect(getValidFieldOperators({ field, operator: 'equals' }).validOperator).toBe('equals')
  })
})
