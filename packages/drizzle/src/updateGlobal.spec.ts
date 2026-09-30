import type { PayloadRequest } from 'payload'

import { beforeEach, describe, expect, it, vi } from 'vitest'

import { findGlobal } from './findGlobal.js'
import type { DrizzleAdapter } from './types.js'
import { updateGlobal } from './updateGlobal.js'
import { upsertRow } from './upsertRow/index.js'

vi.mock('./findGlobal.js', () => ({ findGlobal: vi.fn() }))
vi.mock('./upsertRow/index.js', () => ({ upsertRow: vi.fn() }))

const globalSlug = 'settings'
const branch = 'feature'
const findMany = vi.fn()
const database = { query: { settings: { findMany } } }
const payload = {
  config: {
    branching: {
      branchableGlobals: new Set([globalSlug]),
      enabled: true,
    },
  },
  globals: {
    config: [
      {
        fields: [
          {
            fields: [{ name: 'label', type: 'text' }],
            name: 'items',
            type: 'array',
          },
          { name: 'title', type: 'text' },
        ],
        flattenedFields: [],
        slug: globalSlug,
      },
    ],
  },
}
const adapter = {
  drizzle: database,
  payload,
  sessions: {},
  tableNameMap: new Map([[globalSlug, globalSlug]]),
  tables: { settings: { _branch: 'branch-column' } },
} as unknown as DrizzleAdapter
const req = { payload } as unknown as PayloadRequest

describe('updateGlobal', () => {
  beforeEach(() => {
    findMany.mockResolvedValue([{ _branch: 'main', id: 1, title: 'main title' }])
    vi.mocked(findGlobal).mockResolvedValue({
      _branch: 'main',
      globalType: globalSlug,
      id: 1,
      items: [{ id: 'main-item-id', label: 'main item' }],
      title: 'main title',
    })
    vi.mocked(upsertRow).mockResolvedValue({})
  })

  it('should clone nested main data on the first branch write', async () => {
    await updateGlobal.call(adapter, {
      branch,
      branchConflictData: { title: 'branch title' },
      data: { title: 'branch title' },
      req,
      slug: globalSlug,
    })

    expect(findGlobal).toHaveBeenCalledWith(
      expect.objectContaining({ branch: false, locale: 'all', slug: globalSlug }),
    )
    expect(upsertRow).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          _branch: branch,
          items: [{ id: expect.any(String), label: 'main item' }],
          title: 'branch title',
        },
      }),
    )

    const clonedItems = vi.mocked(upsertRow).mock.calls[0][0].data.items as {
      id: string
    }[]

    expect(clonedItems[0].id).not.toBe('main-item-id')
  })

  it('should update only submitted fields when a concurrent first write wins the upsert', async () => {
    await updateGlobal.call(adapter, {
      branch,
      branchConflictData: { title: 'branch title' },
      data: {
        items: [{ id: 'main-item-id', label: 'main item' }],
        subtitle: 'main subtitle',
        title: 'branch title',
      },
      req,
      slug: globalSlug,
    })

    expect(upsertRow).toHaveBeenCalledWith(
      expect.objectContaining({
        upsertConflictData: {
          _branch: branch,
          title: 'branch title',
        },
      }),
    )
  })
})
