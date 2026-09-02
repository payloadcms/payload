import type { Field, PayloadRequest } from 'payload'

import { describe, expect, it } from 'vitest'

import { resolveAllFilterOptions } from './resolveAllFilterOptions.js'

const mockReq = {} as PayloadRequest

describe('resolveAllFilterOptions', () => {
  it('resolves relationship filterOptions into a Where query keyed by relationTo collection', async () => {
    const fields = [
      {
        name: 'relationshipField',
        type: 'relationship',
        relationTo: 'posts',
        filterOptions: () => ({ status: { equals: 'published' } }),
      },
    ] as Field[]

    const result = await resolveAllFilterOptions({ fields, req: mockReq })

    expect(result.get('relationshipField')).toEqual({
      posts: { status: { equals: 'published' } },
    })
  })

  it('resolves select filterOptions into a filtered Option array', async () => {
    const fields = [
      {
        name: 'selectField',
        type: 'select',
        options: [
          { label: 'One', value: 'one' },
          { label: 'Two', value: 'two' },
          { label: 'Three', value: 'three' },
        ],
        filterOptions: ({ options }) =>
          options.filter(
            (option) => (typeof option === 'string' ? option : option.value) !== 'three',
          ),
      },
    ] as Field[]

    const result = await resolveAllFilterOptions({ fields, req: mockReq })

    expect(result.get('selectField')).toEqual([
      { label: 'One', value: 'one' },
      { label: 'Two', value: 'two' },
    ])
  })

  it('awaits an async select filterOptions function and resolves it to a plain Option array', async () => {
    const fields = [
      {
        name: 'selectField',
        type: 'select',
        options: [
          { label: 'One', value: 'one' },
          { label: 'Two', value: 'two' },
          { label: 'Three', value: 'three' },
        ],
        filterOptions: async ({ options }) =>
          options.filter(
            (option) => (typeof option === 'string' ? option : option.value) !== 'three',
          ),
      },
    ] as Field[]

    const result = await resolveAllFilterOptions({ fields, req: mockReq })

    expect(result.get('selectField')).toEqual([
      { label: 'One', value: 'one' },
      { label: 'Two', value: 'two' },
    ])
  })

  it('resolves an async select filterOptions that relabels options (e.g. from a DB-backed lookup)', async () => {
    const labelsFromDB = new Map([
      ['one', 'DB Label One'],
      ['two', 'DB Label Two'],
    ])

    const fields = [
      {
        name: 'selectField',
        type: 'select',
        options: [
          { label: 'One', value: 'one' },
          { label: 'Two', value: 'two' },
        ],
        filterOptions: async ({ options }) =>
          options.map((option) => {
            const value = typeof option === 'string' ? option : option.value
            return { label: labelsFromDB.get(value), value }
          }),
      },
    ] as Field[]

    const result = await resolveAllFilterOptions({ fields, req: mockReq })

    expect(result.get('selectField')).toEqual([
      { label: 'DB Label One', value: 'one' },
      { label: 'DB Label Two', value: 'two' },
    ])
  })

  it('adds an empty array map entry when filterOptions denies all options', async () => {
    const fields = [
      {
        name: 'selectField',
        type: 'select',
        options: [{ label: 'One', value: 'one' }],
        filterOptions: () => [],
      },
    ] as Field[]

    const result = await resolveAllFilterOptions({ fields, req: mockReq })

    expect(result.has('selectField')).toBe(true)
    expect(result.get('selectField')).toEqual([])
  })

  it('does not add a map entry for select fields without a filterOptions function', async () => {
    const fields = [
      {
        name: 'selectField',
        type: 'select',
        options: [{ label: 'One', value: 'one' }],
      },
    ] as Field[]

    const result = await resolveAllFilterOptions({ fields, req: mockReq })

    expect(result.has('selectField')).toBe(false)
  })

  it('resolves select filterOptions nested under a group field using the dot-notation path', async () => {
    const fields = [
      {
        name: 'group',
        type: 'group',
        fields: [
          {
            name: 'selectField',
            type: 'select',
            options: [
              { label: 'One', value: 'one' },
              { label: 'Two', value: 'two' },
            ],
            filterOptions: ({ options }) =>
              options.filter(
                (option) => (typeof option === 'string' ? option : option.value) !== 'two',
              ),
          },
        ],
      },
    ] as Field[]

    const result = await resolveAllFilterOptions({ fields, req: mockReq })

    expect(result.get('group.selectField')).toEqual([{ label: 'One', value: 'one' }])
  })
})
