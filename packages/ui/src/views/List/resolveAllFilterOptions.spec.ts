import type { Field, PayloadRequest } from 'payload'

import { beforeEach, describe, expect, it, vi } from 'vitest'

import { resolveFilterOptions } from '../../utilities/resolveFilterOptions.js'

import { resolveAllFilterOptions } from './resolveAllFilterOptions.js'

vi.mock('../../utilities/resolveFilterOptions.js', () => ({
  resolveFilterOptions: vi.fn(),
}))

const mockResolveFilterOptions = vi.mocked(resolveFilterOptions)

const req = {} as PayloadRequest

describe('resolveAllFilterOptions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockResolveFilterOptions.mockResolvedValue({
      customers: { region: { equals: 'north' } },
    })
  })

  it('should use the virtual path for virtual string fields', async () => {
    const fields = [
      {
        name: 'region',
        type: 'relationship',
        relationTo: 'customers',
        virtual: 'customer.region',
        filterOptions: {
          region: {
            equals: 'north',
          },
        },
      },
    ] as unknown as Field[]

    const result = await resolveAllFilterOptions({
      fields,
      req,
    })

    expect(result.has('customer.region')).toBe(true)
    expect(result.get('customer.region')).toEqual({
      customers: { region: { equals: 'north' } },
    })
    expect(result.has('region')).toBe(false)
  })
})
