import type { Field, PayloadRequest } from 'payload'

import { describe, expect, it, vi } from 'vitest'

import { resolveAllFilterOptions } from './resolveAllFilterOptions.js'

const mockReq = {} as PayloadRequest

const createMockReqWithLogger = () =>
  ({
    payload: {
      logger: {
        error: vi.fn(),
      },
    },
  }) as unknown as PayloadRequest & { payload: { logger: { error: ReturnType<typeof vi.fn> } } }

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

  it('logs and omits the map entry when a relationship filterOptions throws synchronously, without failing sibling fields', async () => {
    const req = createMockReqWithLogger()

    const fields = [
      {
        name: 'brokenRelationship',
        type: 'relationship',
        relationTo: 'posts',
        filterOptions: () => {
          throw new Error('boom')
        },
      },
      {
        name: 'healthySelect',
        type: 'select',
        options: [{ label: 'One', value: 'one' }],
        filterOptions: ({ options }) => options,
      },
    ] as Field[]

    const result = await resolveAllFilterOptions({ fields, req })

    expect(result.has('brokenRelationship')).toBe(false)
    expect(result.get('healthySelect')).toEqual([{ label: 'One', value: 'one' }])
    expect(req.payload.logger.error).toHaveBeenCalledTimes(1)
    expect(req.payload.logger.error).toHaveBeenCalledWith(
      expect.objectContaining({ msg: expect.stringContaining('brokenRelationship') }),
    )
  })

  it('logs and omits the map entry when a relationship filterOptions rejects asynchronously', async () => {
    const req = createMockReqWithLogger()

    const fields = [
      {
        name: 'brokenRelationship',
        type: 'relationship',
        relationTo: 'posts',
        filterOptions: async () => {
          throw new Error('boom')
        },
      },
    ] as Field[]

    const result = await resolveAllFilterOptions({ fields, req })

    expect(result.has('brokenRelationship')).toBe(false)
    expect(req.payload.logger.error).toHaveBeenCalledTimes(1)
  })

  it('logs and omits the map entry when a select filterOptions throws synchronously, without failing sibling fields', async () => {
    const req = createMockReqWithLogger()

    const fields = [
      {
        name: 'brokenSelect',
        type: 'select',
        options: [{ label: 'One', value: 'one' }],
        filterOptions: () => {
          throw new Error('boom')
        },
      },
      {
        name: 'healthySelect',
        type: 'select',
        options: [{ label: 'One', value: 'one' }],
        filterOptions: ({ options }) => options,
      },
    ] as Field[]

    const result = await resolveAllFilterOptions({ fields, req })

    expect(result.has('brokenSelect')).toBe(false)
    expect(result.get('healthySelect')).toEqual([{ label: 'One', value: 'one' }])
    expect(req.payload.logger.error).toHaveBeenCalledTimes(1)
    expect(req.payload.logger.error).toHaveBeenCalledWith(
      expect.objectContaining({ msg: expect.stringContaining('brokenSelect') }),
    )
  })

  it('logs and omits the map entry when a select filterOptions rejects asynchronously', async () => {
    const req = createMockReqWithLogger()

    const fields = [
      {
        name: 'brokenSelect',
        type: 'select',
        options: [{ label: 'One', value: 'one' }],
        filterOptions: async () => {
          throw new Error('boom')
        },
      },
    ] as Field[]

    const result = await resolveAllFilterOptions({ fields, req })

    expect(result.has('brokenSelect')).toBe(false)
    expect(req.payload.logger.error).toHaveBeenCalledTimes(1)
  })
})
