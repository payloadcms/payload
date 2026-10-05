/* eslint vitest/no-standalone-expect: ["error", { "additionalTestBlockFunctions": ["test"] }] -- Tests use the shared fixture wrapper. */
import { createPayloadRequest } from 'payload'
import { expect, vi } from 'vitest'

// eslint-disable-next-line payload/no-relative-monorepo-imports -- Exercise the internal server handler against the real database.
import { getDashboardDocuments } from '../../packages/ui/src/widgets/RecentlyViewed/getDocuments.js'
import { test } from '../__helpers/int/vitest.js'

test.suite('Dashboard document pagination', { config: './config.ts' }, () => {
  test('should populate only the requested recent page and load the next page on demand', async ({
    payload,
  }) => {
    const owner = await payload.create({
      collection: 'users',
      data: { email: 'recent-pages@payloadcms.com', password: 'test' },
      overrideAccess: true,
    })
    const user = { ...owner, collection: 'users' as const }
    const documents = await Promise.all(
      Array.from({ length: 9 }, (_, index) =>
        payload.create({
          collection: 'tickets',
          data: { title: `Recent ${index}` },
          overrideAccess: true,
        }),
      ),
    )
    await payload.create({
      collection: 'payload-preferences',
      data: {
        key: 'recently-viewed',
        user: { relationTo: 'users', value: user.id },
        value: {
          items: documents.map((doc) => ({
            id: doc.id,
            collectionSlug: 'tickets',
            viewedAt: new Date().toISOString(),
          })),
        },
      },
      overrideAccess: true,
      user,
    })
    const req = await createPayloadRequest({ payload, req: { user } })
    const find = vi.spyOn(payload, 'find')

    try {
      const first = await getDashboardDocuments({ limit: 4, page: 1, req, tab: 'recents' })

      expect(first.totalDocs).toBe(9)
      expect(first.items.map((item) => item.id)).toEqual(documents.slice(0, 4).map((doc) => doc.id))
      const hydrated = find.mock.calls.filter(
        ([args]) => args.collection === 'tickets' && args.depth === 1,
      )

      expect(hydrated).toHaveLength(1)
      expect(hydrated[0][0].where).toEqual({
        id: { in: documents.slice(0, 4).map((doc) => doc.id) },
      })
      find.mockClear()
      const second = await getDashboardDocuments({ limit: 4, page: 2, req, tab: 'recents' })

      expect(second.items.map((item) => item.id)).toEqual(
        documents.slice(4, 8).map((doc) => doc.id),
      )
      expect(
        find.mock.calls.filter(([args]) => args.collection === 'tickets' && args.depth === 1)[0][0]
          .limit,
      ).toBe(4)
      const filtered = await getDashboardDocuments({
        excludedCollections: ['tickets'],
        limit: 4,
        page: 1,
        req,
        tab: 'recents',
      })

      expect(filtered.items).toHaveLength(0)
      expect(filtered.totalDocs).toBe(0)
    } finally {
      find.mockRestore()
    }
  })

  test('should query only a page of pins belonging to the authenticated user', async ({
    payload,
  }) => {
    const owner = await payload.create({
      collection: 'users',
      data: { email: 'pin-pages@payloadcms.com', password: 'test' },
      overrideAccess: true,
    })
    const other = await payload.create({
      collection: 'users',
      data: { email: 'other-pages@payloadcms.com', password: 'test' },
      overrideAccess: true,
    })
    const user = { ...owner, collection: 'users' as const }
    const documents = []

    for (let index = 0; index < 6; index++) {
      const doc = await payload.create({
        collection: 'tickets',
        data: { title: `Pin ${index}` },
        overrideAccess: true,
      })
      documents.push(doc)
      await payload.create({
        collection: 'payload-pinned-documents',
        data: {
          document: { relationTo: 'tickets', value: doc.id },
          key: '',
          user: { relationTo: 'users', value: owner.id },
        },
        overrideAccess: false,
        user,
      })
    }
    await payload.create({
      collection: 'payload-pinned-documents',
      data: {
        document: { relationTo: 'tickets', value: documents[0].id },
        key: '',
        user: { relationTo: 'users', value: other.id },
      },
      overrideAccess: false,
      user: { ...other, collection: 'users' },
    })
    const req = await createPayloadRequest({ payload, req: { user } })
    const find = vi.spyOn(payload, 'find')

    try {
      const first = await getDashboardDocuments({
        excludedCollections: ['tickets'],
        limit: 4,
        page: 1,
        req,
        tab: 'pinned',
      })
      const second = await getDashboardDocuments({
        excludedCollections: ['tickets'],
        limit: 4,
        page: 2,
        req,
        tab: 'pinned',
      })

      expect(first.totalDocs).toBe(6)
      expect(first.items).toHaveLength(4)
      expect(second.items).toHaveLength(2)
      expect(new Set([...first.items, ...second.items].map((item) => item.id)).size).toBe(6)
      const pinQueries = find.mock.calls.filter(
        ([args]) => args.collection === 'payload-pinned-documents',
      )

      expect(pinQueries.map(([args]) => [args.limit, args.page])).toEqual([
        [4, 1],
        [4, 2],
      ])
      expect(
        find.mock.calls.every(
          ([args]) => args.overrideAccess === false && args.user.id === owner.id,
        ),
      ).toBe(true)
    } finally {
      find.mockRestore()
    }
  })

  test('should retain draft documents in pinned and recently viewed pages', async ({ payload }) => {
    const owner = await payload.create({
      collection: 'users',
      data: { email: 'draft-pages@payloadcms.com', password: 'test' },
      overrideAccess: true,
    })
    const user = { ...owner, collection: 'users' as const }
    const document = await payload.create({
      collection: 'draft-posts',
      data: { title: 'Pinned draft' },
      draft: true,
      overrideAccess: false,
      user,
    })

    await payload.create({
      collection: 'payload-pinned-documents',
      data: {
        document: { relationTo: 'draft-posts', value: document.id },
        key: '',
        user: { relationTo: 'users', value: owner.id },
      },
      overrideAccess: false,
      user,
    })
    await payload.create({
      collection: 'payload-preferences',
      data: {
        key: 'recently-viewed',
        user: { relationTo: 'users', value: owner.id },
        value: {
          items: [{ id: document.id, collectionSlug: 'draft-posts' }],
        },
      },
      user,
    })
    const req = await createPayloadRequest({ payload, req: { user } })

    for (const tab of ['pinned', 'recents'] as const) {
      const result = await getDashboardDocuments({ limit: 4, page: 1, req, tab })

      expect(result.items).toHaveLength(1)
      expect(result.items[0]).toMatchObject({
        id: document.id,
        isDraft: true,
        title: 'Pinned draft',
      })
    }
    await expect(
      // @ts-expect-error The removed drafts tab must also be rejected at runtime.
      getDashboardDocuments({ limit: 4, page: 1, req, tab: 'drafts' }),
    ).rejects.toThrow('Invalid dashboard tab')
  })

  test('should reject anonymous requests and unsupported page sizes', async ({ payload }) => {
    const req = await createPayloadRequest({ payload })

    await expect(getDashboardDocuments({ limit: 4, page: 1, req, tab: 'recents' })).rejects.toThrow(
      'Unauthorized',
    )
    const owner = await payload.create({
      collection: 'users',
      data: { email: 'invalid-pages@payloadcms.com', password: 'test' },
      overrideAccess: true,
    })
    const authenticatedReq = await createPayloadRequest({
      payload,
      user: { ...owner, collection: 'users' },
    })

    await expect(
      getDashboardDocuments({ limit: 20, page: 1, req: authenticatedReq, tab: 'recents' }),
    ).rejects.toThrow('Invalid dashboard page')
  })
})
