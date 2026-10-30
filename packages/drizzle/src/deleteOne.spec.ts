import type { DrizzleAdapter } from './types.js'

import { beforeEach, describe, expect, it, vi } from 'vitest'

import { deleteOne } from './deleteOne.js'
import { buildQuery } from './queries/buildQuery.js'
import { selectDistinct } from './queries/selectDistinct.js'

vi.mock('./queries/buildQuery.js', () => ({ buildQuery: vi.fn() }))
vi.mock('./queries/selectDistinct.js', () => ({ selectDistinct: vi.fn() }))
vi.mock('./find/buildFindManyArgs.js', () => ({ buildFindManyArgs: vi.fn(() => ({})) }))
vi.mock('./transform/read/index.js', () => ({ transform: vi.fn(({ data }) => data) }))
vi.mock('./utilities/readAfterWrite.js', () => ({ markWrite: vi.fn() }))
vi.mock('./utilities/getTransaction.js', () => ({ getTransaction: vi.fn() }))
vi.mock('./utilities/getPrimaryDb.js', () => ({
  getPrimaryDb: vi.fn((adapter: any) => adapter.drizzle),
}))

const mockFindFirst = vi.fn()
const mockDeleteWhere = vi.fn()

const adapter = {
  deleteWhere: mockDeleteWhere,
  drizzle: {
    query: {
      users: {
        findFirst: mockFindFirst,
      },
    },
  },
  payload: {
    collections: {
      users: {
        config: {
          flattenedFields: [],
          slug: 'users',
        },
      },
    },
    config: {},
  },
  sessions: {},
  tableNameMap: new Map([['users', 'users']]),
  tables: {
    users: {
      id: 'users.id',
    },
  },
} as unknown as DrizzleAdapter

describe('deleteOne', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return null without calling findFirst when joins are present and selectDistinct finds no matching row', async () => {
    vi.mocked(buildQuery).mockReturnValue({
      joins: [{ condition: 'test_condition', table: 'related_table' }],
      selectFields: {},
      where: { test: true },
    } as any)
    vi.mocked(selectDistinct).mockResolvedValue([] as any)

    const result = await deleteOne.call(adapter, {
      collection: 'users',
      where: { 'related.field': { equals: 'value' } },
    })

    expect(selectDistinct).toHaveBeenCalledTimes(1)
    expect(mockFindFirst).not.toHaveBeenCalled()
    expect(mockDeleteWhere).not.toHaveBeenCalled()
    expect(result).toBeNull()
  })

  it('should fall back to findFirst when no joins are present and selectDistinct returns no id', async () => {
    vi.mocked(buildQuery).mockReturnValue({
      joins: [],
      selectFields: {},
      where: { test: true },
    } as any)
    vi.mocked(selectDistinct).mockResolvedValue([] as any)
    mockFindFirst.mockResolvedValue({ id: 2, name: 'Alice' })

    const result = await deleteOne.call(adapter, {
      collection: 'users',
      where: { name: { equals: 'Alice' } },
    })

    expect(selectDistinct).toHaveBeenCalledTimes(1)
    expect(mockFindFirst).toHaveBeenCalledTimes(1)
    expect(mockDeleteWhere).toHaveBeenCalledTimes(1)
    expect(result).toEqual({ id: 2, name: 'Alice' })
  })

  it('should delete and return document when selectDistinct finds matching id', async () => {
    vi.mocked(buildQuery).mockReturnValue({
      joins: [{ condition: 'test_condition', table: 'related_table' }],
      selectFields: {},
      where: { test: true },
    } as any)
    vi.mocked(selectDistinct).mockResolvedValue([{ id: 1 }] as any)
    mockFindFirst.mockResolvedValue({ id: 1, name: 'Bob' })

    const result = await deleteOne.call(adapter, {
      collection: 'users',
      where: { 'related.field': { equals: 'value' } },
    })

    expect(selectDistinct).toHaveBeenCalledTimes(1)
    expect(mockFindFirst).toHaveBeenCalledTimes(1)
    expect(mockDeleteWhere).toHaveBeenCalledTimes(1)
    expect(result).toEqual({ id: 1, name: 'Bob' })
  })
})
