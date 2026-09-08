import type { DrizzleAdapter } from './types.js'

import { beforeEach, describe, expect, it, vi } from 'vitest'

import { buildQuery } from './queries/buildQuery.js'
import { selectDistinct } from './queries/selectDistinct.js'
import { updateOne } from './updateOne.js'
import { upsertRow } from './upsertRow/index.js'

vi.mock('./queries/buildQuery.js', () => ({ buildQuery: vi.fn() }))
vi.mock('./queries/selectDistinct.js', () => ({ selectDistinct: vi.fn() }))
vi.mock('./upsertRow/index.js', () => ({ upsertRow: vi.fn() }))

const conditionalWhere = { conditional: true }

const adapter = {
  drizzle: {},
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
} as unknown as DrizzleAdapter

describe('updateOne', () => {
  beforeEach(() => {
    vi.mocked(buildQuery).mockReturnValue({
      joins: [],
      selectFields: {},
      where: conditionalWhere,
    } as ReturnType<typeof buildQuery>)
    vi.mocked(selectDistinct).mockResolvedValue([{ id: 1 }])
    vi.mocked(upsertRow).mockResolvedValue({ id: 1 })
  })

  it('should apply the original condition to the selected update', async () => {
    await updateOne.call(adapter, {
      collection: 'users',
      data: {
        hash: 'updated-hash',
        salt: 'updated-salt',
      },
      select: { id: true },
      where: {
        hash: { equals: 'existing-hash' },
        id: { equals: 1 },
        salt: { equals: 'existing-salt' },
      },
    })

    expect(selectDistinct).toHaveBeenCalledTimes(1)
    expect(upsertRow).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 1,
        where: conditionalWhere,
      }),
    )
  })
})
