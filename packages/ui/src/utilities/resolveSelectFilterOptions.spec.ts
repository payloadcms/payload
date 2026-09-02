import type { PayloadRequest, SelectField } from 'payload'

import { describe, expect, it } from 'vitest'

import { resolveSelectFilterOptions } from './resolveSelectFilterOptions.js'

const mockReq = {} as PayloadRequest

describe('resolveSelectFilterOptions', () => {
  it('returns undefined when the field has no filterOptions function', async () => {
    const field = {
      name: 'selectField',
      type: 'select',
      options: [{ label: 'One', value: 'one' }],
    } as SelectField

    const result = await resolveSelectFilterOptions({
      data: {},
      field,
      req: mockReq,
      siblingData: {},
    })

    expect(result).toBeUndefined()
  })

  it('resolves a sync filterOptions function into an Option array', async () => {
    const field = {
      name: 'selectField',
      type: 'select',
      options: [
        { label: 'One', value: 'one' },
        { label: 'Two', value: 'two' },
      ],
      filterOptions: ({ options }) =>
        options.filter((option) => option !== 'one' && option.value !== 'one'),
    } as SelectField

    const result = await resolveSelectFilterOptions({
      data: {},
      field,
      req: mockReq,
      siblingData: {},
    })

    expect(result).toEqual([{ label: 'Two', value: 'two' }])
  })

  it('resolves a filterOptions function that denies all options to an empty array', async () => {
    const field = {
      name: 'selectField',
      type: 'select',
      options: [
        { label: 'One', value: 'one' },
        { label: 'Two', value: 'two' },
      ],
      filterOptions: () => [],
    } as SelectField

    const result = await resolveSelectFilterOptions({
      data: {},
      field,
      req: mockReq,
      siblingData: {},
    })

    expect(result).toEqual([])
  })

  it('awaits an async filterOptions function and passes through data and siblingData', async () => {
    const receivedArgs: unknown[] = []

    const field = {
      name: 'selectField',
      type: 'select',
      options: [{ label: 'One', value: 'one' }],
      filterOptions: async (args) => {
        receivedArgs.push(args)
        return args.options
      },
    } as SelectField

    const data = { disallowOption1: true }
    const siblingData = { disallowOption1: true }

    const result = await resolveSelectFilterOptions({ data, field, req: mockReq, siblingData })

    expect(result).toEqual(field.options)
    expect(receivedArgs).toEqual([{ data, options: field.options, req: mockReq, siblingData }])
  })
})
