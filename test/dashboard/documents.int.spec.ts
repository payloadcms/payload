/* eslint vitest/no-standalone-expect: ["error", { "additionalTestBlockFunctions": ["test"] }] -- Tests use the shared fixture wrapper. */
import { createPayloadRequest, UnauthorizedError } from 'payload'
import { PREFERENCE_KEYS } from 'payload/shared'
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
      expect(hydrated[0][0].select).toEqual({
        _status: true,
        id: true,
        title: true,
        updatedAt: true,
      })
      const identities = find.mock.calls.filter(
        ([args]) => args.collection === 'tickets' && args.depth === 0,
      )
      expect(identities).toHaveLength(1)
      expect(identities[0][0].select).toEqual({ id: true })
      expect(
        find.mock.calls.filter(
          ([args]) =>
            args.collection === 'payload-preferences' &&
            JSON.stringify(args.where).includes(PREFERENCE_KEYS.PINNED_DOCUMENTS),
        ),
      ).toHaveLength(0)
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

  test('should load only the visible documents from the authenticated user pin preference', async ({
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
      documents.push(
        await payload.create({
          collection: 'tickets',
          data: { title: `Pin ${index}` },
          overrideAccess: true,
        }),
      )
    }
    for (const [identity, items] of [
      [user, documents.map((doc) => ({ id: doc.id, collectionSlug: 'tickets' }))],
      [
        { ...other, collection: 'users' as const },
        [{ id: documents[0].id, collectionSlug: 'tickets' }],
      ],
    ] as const) {
      await payload.create({
        collection: 'payload-preferences',
        data: { key: PREFERENCE_KEYS.PINNED_DOCUMENTS, value: { items } },
        overrideAccess: false,
        user: identity,
      })
    }
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
      expect(first.items.map((item) => item.id)).toEqual(documents.slice(0, 4).map((doc) => doc.id))
      expect(second.items.map((item) => item.id)).toEqual(documents.slice(4).map((doc) => doc.id))
      const documentQueries = find.mock.calls.filter(
        ([args]) => args.collection === 'tickets' && args.depth === 1,
      )

      expect(documentQueries.map(([args]) => args.limit)).toEqual([4, 2])
      expect(
        find.mock.calls.every(
          ([args]) => args.overrideAccess === false && args.user.id === owner.id,
        ),
      ).toBe(true)
    } finally {
      find.mockRestore()
    }
  })

  test('should reserve a placeholder page without loading target documents when pins fill a page', async ({
    payload,
  }) => {
    const owner = await payload.create({
      collection: 'users',
      data: { email: 'pin-placeholder@payloadcms.com', password: 'test' },
      overrideAccess: true,
    })
    const user = { ...owner, collection: 'users' as const }

    const items = []

    for (let index = 0; index < 4; index++) {
      const document = await payload.create({
        collection: 'tickets',
        data: { title: `Pin ${index}` },
        overrideAccess: false,
        user,
      })

      items.push({ id: document.id, collectionSlug: 'tickets' })
    }
    await payload.create({
      collection: 'payload-preferences',
      data: { key: PREFERENCE_KEYS.PINNED_DOCUMENTS, value: { items } },
      overrideAccess: false,
      user,
    })
    const req = await createPayloadRequest({ payload, req: { user } })
    const find = vi.spyOn(payload, 'find')

    try {
      const result = await getDashboardDocuments({
        limit: 4,
        page: 2,
        req,
        shouldIncludePinPlaceholder: true,
        tab: 'pinned',
      })

      expect(result).toEqual({ items: [], page: 2, totalDocs: 4 })
      expect(
        find.mock.calls.filter(([args]) => args.collection === 'tickets' && args.depth === 1),
      ).toHaveLength(0)
      const clamped = await getDashboardDocuments({
        limit: 4,
        page: 99,
        req,
        shouldIncludePinPlaceholder: true,
        tab: 'pinned',
      })

      expect(clamped).toEqual(result)
    } finally {
      find.mockRestore()
    }
  })

  test('should discard deleted references before counting and slicing either tab', async ({
    payload,
  }) => {
    const owner = await payload.create({
      collection: 'users',
      data: { email: 'deleted-pins@payloadcms.com', password: 'test' },
      overrideAccess: true,
    })
    const user = { ...owner, collection: 'users' as const }
    const documents = []

    for (let index = 0; index < 5; index++) {
      documents.push(
        await payload.create({
          collection: 'tickets',
          data: { title: `Deleted pin ${index}` },
          overrideAccess: false,
          user,
        }),
      )
    }
    const items = documents.map(({ id }) => ({ id, collectionSlug: 'tickets' }))

    for (const key of [PREFERENCE_KEYS.PINNED_DOCUMENTS, PREFERENCE_KEYS.RECENTLY_VIEWED]) {
      await payload.create({
        collection: 'payload-preferences',
        data: { key, user: { relationTo: 'users', value: owner.id }, value: { items } },
        overrideAccess: false,
        user,
      })
    }
    for (const document of documents.slice(0, 4)) {
      await payload.delete({ collection: 'tickets', id: document.id, overrideAccess: false, user })
    }
    const req = await createPayloadRequest({ payload, req: { user } })

    for (const tab of ['pinned', 'recents'] as const) {
      const result = await getDashboardDocuments({
        limit: 4,
        page: 99,
        req,
        shouldIncludePinPlaceholder: true,
        tab,
      })

      expect(result.totalDocs).toBe(1)
      expect(result.page).toBe(1)
      expect(result.items.map(({ id }) => id)).toEqual([documents[4].id])
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
      collection: 'payload-preferences',
      data: {
        key: PREFERENCE_KEYS.PINNED_DOCUMENTS,
        value: { items: [{ id: document.id, collectionSlug: 'draft-posts' }] },
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
      UnauthorizedError,
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
