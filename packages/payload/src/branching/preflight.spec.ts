import { expect, test, vi } from 'vitest'

import { runMergePreflight } from './preflight.js'

const getLatestCollectionVersion = vi.hoisted(() => vi.fn())
vi.mock('../versions/getLatestCollectionVersion.js', () => ({ getLatestCollectionVersion }))

test.each(['field', 'mainWhere'])(
  'should authorize main after a Trash transition (%s)',
  async (denial) => {
    const shadow = { id: 'shadow', title: 'Branch title' }
    const main = { id: 'main', title: 'Main title' }
    const payload = {
      config: { localization: false },
      collections: {
        posts: {
          config: {
            fields: [{ name: 'title', type: 'text', access: { update: () => denial !== 'field' } }],
            access: {
              delete: () => true,
              update: () => (denial === 'mainWhere' ? { allowed: { equals: true } } : true),
            },
          },
        },
      },
      db: { findOne: vi.fn(async () => main) },
    }
    const pending = [
      {
        change: { id: 'change', branch: 'campaign' },
        collectionSlug: 'posts',
        docID: 'main',
        writes: [
          { operation: 'delete', data: shadow, draft: false },
          { operation: 'update', data: shadow, draft: false },
        ],
      },
    ]

    getLatestCollectionVersion.mockResolvedValue(denial === 'mainWhere' ? null : main)
    const blocked = await runMergePreflight({
      payload: payload as never,
      pending: pending as never,
      req: { context: {} } as never,
    })

    expect(blocked).toContainEqual(
      expect.objectContaining({ changeID: 'change', reason: 'access', operation: 'update' }),
    )
    expect(getLatestCollectionVersion).toHaveBeenCalled()
  },
)
