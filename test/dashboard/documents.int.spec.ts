/* eslint vitest/no-standalone-expect: ["error", { "additionalTestBlockFunctions": ["test"] }] -- Tests use the shared fixture wrapper. */
import { createPayloadRequest, UnauthorizedError } from 'payload'
import { instructionsCollectionSlug, PREFERENCE_KEYS } from 'payload/shared'
import { expect, vi } from 'vitest'

// eslint-disable-next-line payload/no-relative-monorepo-imports -- Exercise the internal server handler against the real database.
import { getActivityWidgetDocs } from '../../packages/ui/src/widgets/Activity/utils/getActivityWidgetDocs.js'
// eslint-disable-next-line payload/no-relative-monorepo-imports -- Share the batch size used by the widget.
import { DOCUMENTS_BATCH_SIZE } from '../../packages/ui/src/widgets/Activity/utils/constants.js'
import { test } from '../__helpers/int/vitest.js'

test.suite('Dashboard document pagination', { config: './config.ts' }, () => {
  test('should exclude group false collections from both tabs before pagination', async ({
    payload,
  }) => {
    const owner = await payload.create({
      collection: 'users',
      data: { email: 'dashboard-visibility@payloadcms.com', password: 'test' },
      overrideAccess: true,
    })
    const user = { ...owner, collection: 'users' as const }
    const event = await payload.create({
      collection: 'events',
      data: { startDate: '2026-01-01T12:00:00.000Z', title: 'Excluded event' },
      user,
    })
    const instructions = await payload.findByID({
      id: 'collection-tickets',
      collection: instructionsCollectionSlug,
      overrideAccess: false,
      user,
    })
    const tickets = await Promise.all(
      ['First visible ticket', 'Second visible ticket'].map((title) =>
        payload.create({ collection: 'tickets', data: { title }, user }),
      ),
    )
    const items = [
      { id: event.id, collectionSlug: 'events' },
      { id: instructions.id, collectionSlug: instructionsCollectionSlug },
      ...tickets.map(({ id }) => ({ id, collectionSlug: 'tickets' })),
    ]

    for (const key of [PREFERENCE_KEYS.PINNED_DOCUMENTS, PREFERENCE_KEYS.RECENTLY_VIEWED]) {
      await payload.create({
        collection: 'payload-preferences',
        data: { key, value: { items } },
        overrideAccess: false,
        user,
      })
    }

    const req = await createPayloadRequest({ payload, req: { user } })
    const admin = payload.collections.events.config.admin
    const previousGroup = admin.group

    admin.group = false

    try {
      for (const type of ['pinned', 'recents'] as const) {
        const result = await getActivityWidgetDocs({ type, limit: 1, page: 2, req })

        expect(result.totalDocs).toBe(2)
        expect(result.page).toBe(2)
        expect(result.items.map(({ id }) => id)).toEqual([tickets[1].id])
      }
    } finally {
      admin.group = previousGroup
    }
  })

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
      const first = await getActivityWidgetDocs({ type: 'recents', limit: 4, page: 1, req })

      expect(first.totalDocs).toBe(9)
      expect(first.items.map((item) => item.id)).toEqual(documents.slice(0, 4).map((doc) => doc.id))
      const hydrated = find.mock.calls.filter(
        ([args]) => args.collection === 'tickets' && args.depth === 1,
      )

      expect(hydrated).toHaveLength(1)
      expect(hydrated[0][0].select).toEqual({
        id: true,
        _status: true,
        title: true,
        updatedAt: true,
      })
      const identities = find.mock.calls.filter(
        ([args]) => args.collection === 'tickets' && args.depth === 0,
      )
      expect(identities).toHaveLength(1)
      expect(identities[0][0].select).toEqual({ id: true })
      expect(identities[0][0].sort).toBe('id')
      expect(hydrated[0][0].sort).toBe('id')
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
      const second = await getActivityWidgetDocs({ type: 'recents', limit: 4, page: 2, req })

      expect(second.items.map((item) => item.id)).toEqual(
        documents.slice(4, 8).map((doc) => doc.id),
      )
      expect(
        find.mock.calls.filter(([args]) => args.collection === 'tickets' && args.depth === 1)[0][0]
          .limit,
      ).toBe(4)
      const filtered = await getActivityWidgetDocs({
        type: 'recents',
        excludedCollections: ['tickets'],
        limit: 4,
        page: 1,
        req,
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
      const first = await getActivityWidgetDocs({
        type: 'pinned',
        excludedCollections: ['tickets'],
        limit: 4,
        page: 1,
        req,
      })
      const second = await getActivityWidgetDocs({
        type: 'pinned',
        excludedCollections: ['tickets'],
        limit: 4,
        page: 2,
        req,
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

  test('should load pins in fixed batches that fill the largest widget page', async ({
    payload,
  }) => {
    const owner = await payload.create({
      collection: 'users',
      data: { email: 'pin-batches@payloadcms.com', password: 'test' },
      overrideAccess: true,
    })
    const user = { ...owner, collection: 'users' as const }
    const documents = await Promise.all(
      Array.from({ length: DOCUMENTS_BATCH_SIZE + 2 }, (_, index) =>
        payload.create({
          collection: 'tickets',
          data: { title: `Batch ${index}` },
          overrideAccess: true,
        }),
      ),
    )

    await payload.create({
      collection: 'payload-preferences',
      data: {
        key: PREFERENCE_KEYS.PINNED_DOCUMENTS,
        value: { items: documents.map((doc) => ({ id: doc.id, collectionSlug: 'tickets' })) },
      },
      overrideAccess: false,
      user,
    })
    const req = await createPayloadRequest({ payload, req: { user } })
    const find = vi.spyOn(payload, 'find')

    try {
      const first = await getActivityWidgetDocs({
        type: 'pinned',
        limit: DOCUMENTS_BATCH_SIZE,
        page: 1,
        req,
      })
      const second = await getActivityWidgetDocs({
        type: 'pinned',
        limit: DOCUMENTS_BATCH_SIZE,
        page: 2,
        req,
      })

      expect(first.totalDocs).toBe(DOCUMENTS_BATCH_SIZE + 2)
      expect(first.items.map((item) => item.id)).toEqual(
        documents.slice(0, DOCUMENTS_BATCH_SIZE).map((doc) => doc.id),
      )
      expect(second.page).toBe(2)
      expect(second.items.map((item) => item.id)).toEqual(
        documents.slice(DOCUMENTS_BATCH_SIZE).map((doc) => doc.id),
      )
      expect(
        find.mock.calls
          .filter(([args]) => args.collection === 'tickets' && args.depth === 1)
          .map(([args]) => args.limit),
      ).toEqual([DOCUMENTS_BATCH_SIZE, 2])
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
      const result = await getActivityWidgetDocs({
        type: 'pinned',
        limit: 4,
        page: 2,
        req,
        shouldIncludePinPlaceholder: true,
      })

      expect(result).toEqual({ items: [], page: 2, totalDocs: 4 })
      expect(
        find.mock.calls.filter(([args]) => args.collection === 'tickets' && args.depth === 1),
      ).toHaveLength(0)
      const clamped = await getActivityWidgetDocs({
        type: 'pinned',
        limit: 4,
        page: 99,
        req,
        shouldIncludePinPlaceholder: true,
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
      await payload.delete({ id: document.id, collection: 'tickets', overrideAccess: false, user })
    }
    const req = await createPayloadRequest({ payload, req: { user } })

    for (const type of ['pinned', 'recents'] as const) {
      const result = await getActivityWidgetDocs({
        type,
        limit: 4,
        page: 99,
        req,
        shouldIncludePinPlaceholder: true,
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

    for (const type of ['pinned', 'recents'] as const) {
      const result = await getActivityWidgetDocs({ type, limit: 4, page: 1, req })

      expect(result.items).toHaveLength(1)
      expect(result.items[0]).toMatchObject({
        id: document.id,
        isDraft: true,
        title: 'Pinned draft',
      })
    }
    await expect(
      // @ts-expect-error The removed drafts tab must also be rejected at runtime.
      getActivityWidgetDocs({ type: 'drafts', limit: 4, page: 1, req }),
    ).rejects.toThrow('Invalid activity document type')
  })

  test('should reject anonymous requests and unsupported page sizes', async ({ payload }) => {
    const req = await createPayloadRequest({ payload })

    await expect(
      getActivityWidgetDocs({ type: 'recents', limit: 4, page: 1, req }),
    ).rejects.toThrow(UnauthorizedError)
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
      getActivityWidgetDocs({ type: 'recents', limit: 101, page: 1, req: authenticatedReq }),
    ).rejects.toThrow('Invalid dashboard page')
  })

  test('should ignore a default sort on a field the reader cannot access', async ({ payload }) => {
    const owner = await payload.create({
      collection: 'users',
      data: { email: 'default-sort@payloadcms.com', password: 'test' },
      overrideAccess: true,
    })
    const user = { ...owner, collection: 'users' as const }
    const documents = []

    for (const title of ['First preferred', 'Second preferred']) {
      documents.push(await payload.create({ collection: 'tickets', data: { title }, user }))
    }
    const items = documents.map(({ id }) => ({ id, collectionSlug: 'tickets' })).reverse()

    for (const key of [PREFERENCE_KEYS.PINNED_DOCUMENTS, PREFERENCE_KEYS.RECENTLY_VIEWED]) {
      await payload.create({
        collection: 'payload-preferences',
        data: { key, value: { items } },
        overrideAccess: false,
        user,
      })
    }
    const config = payload.collections.tickets.config
    const field = config.flattenedFields.find(({ name }) => name === 'description')!
    const previousAccess = field.access
    const previousSort = config.defaultSort

    field.access = { ...field.access, read: () => false }
    config.defaultSort = 'description'

    try {
      await expect(
        payload.find({ collection: 'tickets', overrideAccess: false, user }),
      ).rejects.toThrow()
      const req = await createPayloadRequest({ payload, req: { user } })

      for (const type of ['pinned', 'recents'] as const) {
        const result = await getActivityWidgetDocs({ type, limit: 4, page: 1, req })

        expect(result.items.map(({ id }) => id)).toEqual(items.map(({ id }) => id))
      }
    } finally {
      field.access = previousAccess
      config.defaultSort = previousSort
    }
  })

  test('should show the authenticated user viewing timestamp independently of modification time', async ({
    payload,
  }) => {
    const document = await payload.create({
      collection: 'tickets',
      data: { title: 'Viewed twice' },
      overrideAccess: true,
    })
    const visits = ['2026-01-01T12:00:00.000Z', '2026-02-01T12:00:00.000Z']

    for (const [index, viewedAt] of visits.entries()) {
      const owner = await payload.create({
        collection: 'users',
        data: { email: `viewing-time-${index}@payloadcms.com`, password: 'test' },
        overrideAccess: true,
      })
      const user = { ...owner, collection: 'users' as const }

      await payload.create({
        collection: 'payload-preferences',
        data: {
          key: PREFERENCE_KEYS.RECENTLY_VIEWED,
          value: { items: [{ id: document.id, collectionSlug: 'tickets', viewedAt }] },
        },
        overrideAccess: false,
        user,
      })
      const req = await createPayloadRequest({ payload, req: { user } })
      const result = await getActivityWidgetDocs({ type: 'recents', limit: 4, page: 1, req })

      expect(result.items[0]).toMatchObject({
        dateTime: viewedAt,
        updatedAt: document.updatedAt,
        viewedAt,
      })
    }
  })

  test('should distinguish drafts, published documents and unpublished changes', async ({
    payload,
  }) => {
    const owner = await payload.create({
      collection: 'users',
      data: { email: 'version-status@payloadcms.com', password: 'test' },
      overrideAccess: true,
    })
    const user = { ...owner, collection: 'users' as const }
    const draft = await payload.create({
      collection: 'draft-posts',
      data: { title: 'Never published' },
      draft: true,
      overrideAccess: false,
      user,
    })
    const published = await payload.create({
      collection: 'draft-posts',
      data: { _status: 'published', title: 'Published' },
      overrideAccess: false,
      user,
    })
    const changed = await payload.create({
      collection: 'draft-posts',
      data: { _status: 'published', title: 'Published before changes' },
      overrideAccess: false,
      user,
    })

    await payload.update({
      id: changed.id,
      collection: 'draft-posts',
      data: { title: 'Unpublished changes' },
      draft: true,
      overrideAccess: false,
      user,
    })
    await payload.create({
      collection: 'payload-preferences',
      data: {
        key: PREFERENCE_KEYS.PINNED_DOCUMENTS,
        value: {
          items: [draft, published, changed].map(({ id }) => ({
            id,
            collectionSlug: 'draft-posts',
          })),
        },
      },
      overrideAccess: false,
      user,
    })
    const req = await createPayloadRequest({ payload, req: { user } })
    const result = await getActivityWidgetDocs({ type: 'pinned', limit: 4, page: 1, req })

    expect(result.items.map(({ isDraft, statusLabel }) => ({ isDraft, statusLabel }))).toEqual([
      { isDraft: true, statusLabel: 'Draft' },
      { isDraft: false, statusLabel: 'Published' },
      { isDraft: false, statusLabel: 'Changed' },
    ])
  })
})
