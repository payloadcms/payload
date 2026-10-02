import { describe, expect, it } from 'vitest'

import type { Field, PayloadRequest } from 'payload'

import { resolveAllFilterOptions } from './resolveAllFilterOptions.js'

const req = { user: null } as unknown as PayloadRequest

describe('resolveAllFilterOptions', () => {
  it('should key resolved filterOptions by the virtual path for virtual: string fields', async () => {
    const fields = [
      {
        filterOptions: { id: { in: ['1', '2'] } },
        name: 'region',
        relationTo: 'regions',
        type: 'relationship',
        virtual: 'customer.region',
      },
    ] as Field[]

    const result = await resolveAllFilterOptions({ fields, req })

    // reduceFieldsToOptions keys the WhereBuilder field by its virtual path, so the
    // resolved filterOptions must be stored under that same key
    expect(result.get('customer.region')).toEqual({ regions: { id: { in: ['1', '2'] } } })
    expect(result.has('region')).toBe(false)
  })

  it('should keep keying regular fields by their name', async () => {
    const fields = [
      {
        filterOptions: { id: { exists: true } },
        name: 'author',
        relationTo: 'users',
        type: 'relationship',
      },
    ] as Field[]

    const result = await resolveAllFilterOptions({ fields, req })

    expect(result.get('author')).toEqual({ users: { id: { exists: true } } })
  })

  it('should prefix the virtual path when nested inside a group', async () => {
    const fields = [
      {
        fields: [
          {
            filterOptions: { id: { in: ['1'] } },
            name: 'region',
            relationTo: 'regions',
            type: 'relationship',
            virtual: 'customer.region',
          },
        ],
        name: 'meta',
        type: 'group',
      },
    ] as Field[]

    const result = await resolveAllFilterOptions({ fields, req })

    expect(result.get('meta.customer.region')).toEqual({ regions: { id: { in: ['1'] } } })
  })
})
