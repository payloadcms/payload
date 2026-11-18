import type { DrizzleAdapter } from './types.js'

import { beforeEach, describe, expect, it, vi } from 'vitest'

import { deleteOne } from './deleteOne.js'
import { buildQuery } from './queries/buildQuery.js'
import { selectDistinct } from './queries/selectDistinct.js'

vi.mock('./queries/buildQuery.js', () => ({ buildQuery: vi.fn() }))
vi.mock('./queries/selectDistinct.js', () => ({ selectDistinct: vi.fn() }))

const findFirst = vi.fn()
const deleteWhere = vi.fn()

const adapter = {
  deleteWhere,
  drizzle: { query: { users: { findFirst } } },
  payload: {
    collections: {
      users: {
        config: {
          flattenedFields: [],
          slug: 'users',
        },
      },
    },
  },
  sessions: {},
  tableNameMap: new Map([['users', 'users']]),
  tables: { users: { id: {} } },
} as unknown as DrizzleAdapter

describe('deleteOne', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(buildQuery).mockReturnValue({
      joins: [{ condition: {}, table: {} }],
      selectFields: {},
      where: {},
    } as unknown as ReturnType<typeof buildQuery>)
  })

  it('should return null without querying again when the joined select finds no row', async () => {
    vi.mocked(selectDistinct).mockResolvedValue([])

    const result = await deleteOne.call(adapter, {
      collection: 'users',
      where: { id: { equals: 1 } },
    })

    expect(result).toBeNull()
    expect(findFirst).not.toHaveBeenCalled()
    expect(deleteWhere).not.toHaveBeenCalled()
  })
})
