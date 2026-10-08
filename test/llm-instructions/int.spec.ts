import { initI18n } from '@payloadcms/translations'
import { createPayloadRequest, initTransaction, killTransaction } from 'payload'
import { getLLMInstructions } from 'payload/internal'
import { instructionsCollectionSlug, mergeListSearchAndWhere } from 'payload/shared'
import { expect, onTestFinished } from 'vitest'

import { test } from '../__helpers/int/vitest.js'
import { devUser } from '../credentials.js'
import { additionalInstructions, findInstructions, saveAdditionalInstructions } from './helpers.js'
import { hiddenCollectionSlug, hiddenGlobalSlug } from './slugs.js'

test.suite('LLM instructions', { config: './config.ts' }, () => {
  test('should search and sort instructions by slug regardless of the display language', async ({
    payload,
  }) => {
    const collectionConfig = payload.collections[instructionsCollectionSlug].config
    const germanReq = await createPayloadRequest({
      payload,
      req: {
        i18n: await initI18n({ config: payload.config.i18n, context: 'api', language: 'de' }),
      },
    })

    for (const target of [
      {
        slug: 'pages',
        data: { entitySlug: 'pages', entityType: 'collection' },
        titles: { de: 'Seiten', en: 'Pages' },
      },
      {
        slug: 'site-settings',
        data: { entitySlug: 'site-settings', entityType: 'global' },
        titles: { de: 'Einstellungen', en: 'Site Settings' },
      },
    ] as const) {
      const created = await payload.create({
        collection: instructionsCollectionSlug,
        data: target.data,
        overrideAccess: true,
        req: germanReq,
      })
      const stored = await payload.db.findOne({
        collection: instructionsCollectionSlug,
        where: { id: { equals: created.id } },
      })

      expect(created.title).toBe(target.titles.de)
      expect(stored).toMatchObject(target.data)
      expect(stored).not.toHaveProperty('title')

      for (const language of ['en', 'de'] as const) {
        const req = await createPayloadRequest({
          payload,
          req: {
            i18n: await initI18n({ config: payload.config.i18n, context: 'api', language }),
          },
        })
        const { docs } = await payload.find({
          collection: instructionsCollectionSlug,
          overrideAccess: true,
          req,
          where: mergeListSearchAndWhere({ collectionConfig, search: target.slug }),
        })

        expect(docs).toEqual([
          expect.objectContaining({ id: created.id, title: target.titles[language] }),
        ])
      }
    }

    const { docs } = await payload.find({
      collection: instructionsCollectionSlug,
      overrideAccess: true,
      req: germanReq,
      sort: 'entitySlug',
    })

    expect(docs.map(({ id }) => id)).toEqual(['collection-pages', 'global-site-settings'])
  })

  test('should display changed config labels without rewriting searchable instructions', async ({
    payload,
  }) => {
    const pages = await payload.create({
      collection: instructionsCollectionSlug,
      data: { entitySlug: 'pages', entityType: 'collection' },
      overrideAccess: true,
    })
    const settings = await payload.create({
      collection: instructionsCollectionSlug,
      data: { entitySlug: 'site-settings', entityType: 'global' },
      overrideAccess: true,
    })
    const pageConfig = payload.collections.pages.config
    const settingsConfig = payload.config.globals.find(({ slug }) => slug === 'site-settings')!
    const originalLabels = pageConfig.labels
    const originalLabel = settingsConfig.label

    onTestFinished(() => {
      pageConfig.labels = originalLabels
      settingsConfig.label = originalLabel
    })
    pageConfig.labels = { ...originalLabels, plural: 'Articles' }
    settingsConfig.label = 'Website Settings'

    for (const target of [
      { slug: 'pages', doc: pages, title: 'Articles' },
      { slug: 'site-settings', doc: settings, title: 'Website Settings' },
    ] as const) {
      const { docs } = await payload.find({
        collection: instructionsCollectionSlug,
        overrideAccess: true,
        where: mergeListSearchAndWhere({
          collectionConfig: payload.collections[instructionsCollectionSlug].config,
          search: target.slug,
        }),
      })

      expect(docs).toEqual([
        expect.objectContaining({
          id: target.doc.id,
          title: target.title,
          updatedAt: target.doc.updatedAt,
        }),
      ])
    }
  })

  test('should allow querying an entity slug outside the configured targets', async ({
    payload,
  }) => {
    const result = await payload.find({
      collection: instructionsCollectionSlug,
      overrideAccess: true,
      where: { entitySlug: { equals: 'removed-target' } },
    })

    expect(result.docs).toEqual([])
  })

  for (const target of [
    { slug: hiddenCollectionSlug, type: 'collection', instructions: 'Keep hidden pages private.' },
    { slug: hiddenGlobalSlug, type: 'global', instructions: 'Preserve hidden settings.' },
    { slug: instructionsCollectionSlug, type: 'collection', instructions: '' },
  ] as const) {
    test(`should return only configured instructions for non-target ${target.slug}`, async ({
      payload,
    }) => {
      const req = await createPayloadRequest({ payload })
      const instructions = await getLLMInstructions({
        slug: target.slug,
        type: target.type,
        overrideAccess: true,
        req,
      })

      expect(instructions).toBe(target.instructions)
    })
  }

  test('should return configured instructions when no saved document exists', async ({
    payload,
  }) => {
    const req = await createPayloadRequest({ payload })

    expect(
      await payload.count({ collection: instructionsCollectionSlug, overrideAccess: true }),
    ).toMatchObject({ totalDocs: 0 })
    await expect(
      getLLMInstructions({ slug: 'pages', type: 'collection', overrideAccess: true, req }),
    ).resolves.toBe(payload.collections.pages.config.llmInstructions)
  })

  test('should keep configured instructions when reading saved instructions fails', async ({
    payload,
  }) => {
    const { user } = await payload.login({ collection: 'users', data: devUser })

    await saveAdditionalInstructions({ entitySlug: 'pages', entityType: 'collection', payload })

    const req = await createPayloadRequest({ payload, user })
    const hooks = payload.collections[instructionsCollectionSlug].config.hooks
    const originalHooks = hooks.beforeOperation

    onTestFinished(() => {
      hooks.beforeOperation = originalHooks
    })
    hooks.beforeOperation = [
      () => {
        throw new Error('Instructions storage unavailable')
      },
    ]

    await expect(getLLMInstructions({ slug: 'pages', type: 'collection', req })).resolves.toBe(
      payload.collections.pages.config.llmInstructions,
    )
  })

  for (const data of [
    { entitySlug: 'unknown-collection', entityType: 'collection' },
    { entitySlug: 'unknown-global', entityType: 'global' },
    { entitySlug: hiddenCollectionSlug, entityType: 'collection' },
    { entitySlug: hiddenGlobalSlug, entityType: 'global' },
    { entitySlug: instructionsCollectionSlug, entityType: 'collection' },
  ] as const) {
    test(`should reject creating instructions for non-target ${JSON.stringify(data)}`, async ({
      payload,
    }) => {
      await expect(
        payload.create({ collection: instructionsCollectionSlug, data, overrideAccess: true }),
      ).rejects.toMatchObject({
        name: 'ValidationError',
        data: { errors: [expect.objectContaining({ path: 'entitySlug' })] },
      })
    })
  }

  for (const target of [
    { slug: 'pages', type: 'collection', entitySlug: 'pages', entityType: 'collection' },
    { slug: 'site-settings', type: 'global', entitySlug: 'site-settings', entityType: 'global' },
  ] as const) {
    test(`should combine configured and saved ${target.type} instructions as Markdown`, async ({
      payload,
    }) => {
      const { user } = await payload.login({ collection: 'users', data: devUser })

      await saveAdditionalInstructions({ ...target, payload })

      const req = await createPayloadRequest({ payload, user })
      const instructions = await getLLMInstructions({ slug: target.slug, type: target.type, req })
      const configured =
        target.type === 'collection'
          ? payload.collections[target.slug].config.llmInstructions
          : payload.config.globals.find(({ slug }) => slug === target.slug)?.llmInstructions

      expect(instructions).toBe(
        [configured, 'Keep page summaries under 100 words.'].filter(Boolean).join('\n\n'),
      )
    })
  }

  test('should initialize one instruction document per collection and global without duplicates', async ({
    payload,
  }) => {
    const { user } = await payload.login({ collection: 'users', data: devUser })
    const findInstructions = () =>
      payload.find({
        collection: instructionsCollectionSlug,
        overrideAccess: false,
        pagination: false,
        user,
      })
    const [first, second] = await Promise.all([findInstructions(), findInstructions()])

    expect(first.docs).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'collection-pages',
          entitySlug: 'pages',
          entityType: 'collection',
          title: 'Pages',
        }),
        expect.objectContaining({
          id: 'global-site-settings',
          entitySlug: 'site-settings',
          entityType: 'global',
          title: 'Site Settings',
        }),
      ]),
    )
    expect(second.totalDocs).toBe(first.totalDocs)
    expect(new Set(second.docs.map(({ id }) => id)).size).toBe(second.totalDocs)
    expect(payload.collections[instructionsCollectionSlug].config.admin.group).toBe(false)
    expect(
      (payload.config.plugins ?? []).some((plugin) => plugin.slug === '@payloadcms/plugin-mcp'),
    ).toBe(false)
  })

  test('should preserve concurrent request properties while isolating sync context', async ({
    payload,
  }) => {
    const { user } = await payload.login({ collection: 'users', data: devUser })
    const requests = await Promise.all(
      ['first', 'second'].map((caller) =>
        createPayloadRequest({
          context: { caller },
          payload,
          req: new Request(`https://example.test/api/${caller}`, {
            headers: { 'x-request-id': caller },
            method: 'POST',
          }),
          user,
        }),
      ),
    )
    const hooks = payload.collections[instructionsCollectionSlug].config.hooks
    const originalHooks = hooks.beforeOperation
    const syncRequests: { header: null | string; method: string; url: string }[] = []

    onTestFinished(() => {
      hooks.beforeOperation = originalHooks
    })
    hooks.beforeOperation = [
      ...(originalHooks ?? []),
      ({ args, req }) => {
        if (req.context.syncLLMInstructions) {
          expect(req.transactionID).toBeFalsy()
          syncRequests.push({
            header: req.headers.get('x-request-id'),
            method: req.method,
            url: req.url,
          })
          req.context.syncOnly = true
        }

        return args
      },
    ]

    await Promise.all(
      requests.map((req) =>
        payload.find({ collection: instructionsCollectionSlug, overrideAccess: false, req }),
      ),
    )

    const expectedRequests = requests.map((req) => ({
      header: req.headers.get('x-request-id'),
      method: req.method,
      url: req.url,
    }))

    expect(syncRequests).toEqual(expect.arrayContaining(expectedRequests))
    for (const syncRequest of syncRequests) {
      expect(expectedRequests).toContainEqual(syncRequest)
    }
    for (const req of requests) {
      expect(req.context).toEqual({ caller: req.headers.get('x-request-id') })
    }
  })

  test.options(
    'should keep initialized instructions when a caller rolls back its transaction',
    { db: (adapter) => adapter === 'postgres' || adapter === 'mongodb' },
    async ({ payload }) => {
      const { user } = await payload.login({ collection: 'users', data: devUser })
      const req = await createPayloadRequest({ payload, user })
      const concurrentReq = await createPayloadRequest({ payload, user })

      onTestFinished(() => killTransaction(req))
      expect(await initTransaction(req)).toBe(true)

      const transactionID = req.transactionID
      const [first, concurrent] = await Promise.all([
        payload.find({
          collection: instructionsCollectionSlug,
          depth: 0,
          overrideAccess: false,
          pagination: false,
          req,
        }),
        payload.find({
          collection: instructionsCollectionSlug,
          depth: 0,
          overrideAccess: false,
          pagination: false,
          req: concurrentReq,
        }),
      ])

      expect(req.transactionID).toBe(transactionID)
      expect(concurrentReq.transactionID).toBeUndefined()
      await killTransaction(req)

      // An anonymous Local API read bypasses access without triggering another sync.
      const persisted = await payload.find({
        collection: instructionsCollectionSlug,
        overrideAccess: true,
      })

      expect(first.totalDocs).toBeGreaterThan(0)
      expect(concurrent.docs.map(({ id }) => id)).toEqual(first.docs.map(({ id }) => id))
      expect(persisted.docs.map(({ id }) => id)).toEqual(first.docs.map(({ id }) => id))
    },
  )

  test('should resolve target metadata when only list columns are selected', async ({
    payload,
  }) => {
    const { user } = await payload.login({ collection: 'users', data: devUser })
    const { docs } = await payload.find({
      collection: instructionsCollectionSlug,
      overrideAccess: false,
      select: { title: true, additionalInstructions: true },
      user,
      where: { entitySlug: { equals: 'pages' }, entityType: { equals: 'collection' } },
    })

    expect(docs).toEqual([expect.objectContaining({ title: 'Pages', entityType: 'collection' })])
  })

  test('should prevent changing a configuration-owned target', async ({ payload }) => {
    const { user } = await payload.login({ collection: 'users', data: devUser })
    const doc = await findInstructions({
      entitySlug: 'pages',
      entityType: 'collection',
      payload,
      user,
    })

    await expect(
      payload.update({
        id: doc.id,
        collection: instructionsCollectionSlug,
        data: { entitySlug: 'site-settings', entityType: 'global' },
        overrideAccess: false,
        user,
      }),
    ).rejects.toMatchObject({
      name: 'ValidationError',
      data: {
        errors: [expect.objectContaining({ message: 'The instruction target cannot be changed.' })],
      },
    })
  })

  for (const { data, path } of [
    { data: {}, path: 'entitySlug' },
    { data: { entityType: 'collection' }, path: 'entitySlug' },
    { data: { entitySlug: 'pages' }, path: 'entityType' },
  ] as const) {
    test(`should require ${path} when creating instructions with ${JSON.stringify(data)}`, async ({
      payload,
    }) => {
      await expect(
        // @ts-expect-error Deliberately omit required fields to exercise runtime validation.
        payload.create({ collection: instructionsCollectionSlug, data, overrideAccess: true }),
      ).rejects.toMatchObject({
        name: 'ValidationError',
        data: { errors: expect.arrayContaining([expect.objectContaining({ path })]) },
      })
    })
  }

  for (const { data, path } of [
    { data: { entitySlug: null }, path: 'entitySlug' },
    { data: { entitySlug: '' }, path: 'entitySlug' },
    { data: { entityType: null }, path: 'entityType' },
  ] as const) {
    test(`should require ${path} when updating instructions with ${JSON.stringify(data)}`, async ({
      payload,
    }) => {
      const { user } = await payload.login({ collection: 'users', data: devUser })
      const doc = await findInstructions({
        entitySlug: 'pages',
        entityType: 'collection',
        payload,
        user,
      })

      await expect(
        payload.update({
          id: doc.id,
          collection: instructionsCollectionSlug,
          // @ts-expect-error Deliberately clear required fields to exercise runtime validation.
          data,
          overrideAccess: false,
          user,
        }),
      ).rejects.toMatchObject({
        name: 'ValidationError',
        data: { errors: expect.arrayContaining([expect.objectContaining({ path })]) },
      })
    })
  }

  for (const target of [
    { entitySlug: 'pages', entityType: 'collection' },
    { entitySlug: 'site-settings', entityType: 'global' },
  ] as const) {
    test(`should reject duplicate instructions for ${JSON.stringify(target)}`, async ({
      payload,
    }) => {
      await payload.create({
        collection: instructionsCollectionSlug,
        data: target,
        overrideAccess: true,
      })

      await expect(
        payload.create({
          collection: instructionsCollectionSlug,
          data: target,
          overrideAccess: true,
        }),
      ).rejects.toThrow()
    })

    test(`should preserve the target on a partial update for ${JSON.stringify(target)}`, async ({
      payload,
    }) => {
      const updated = await saveAdditionalInstructions({ ...target, payload })

      expect(updated).toMatchObject({ ...target, additionalInstructions })
    })
  }

  test('should keep system instructions read-only through the API', async ({ payload }) => {
    const { user } = await payload.login({ collection: 'users', data: devUser })
    const original = await findInstructions({
      payload,
      entitySlug: 'pages',
      entityType: 'collection',
      user,
    })
    const updated = await payload.update({
      id: original.id,
      collection: instructionsCollectionSlug,
      data: { systemInstructions: additionalInstructions, title: 'Changed title' },
      overrideAccess: false,
      user,
    })

    expect(updated.systemInstructions).toEqual(original.systemInstructions)
    expect(updated.title).toBe('Pages')
    expect(updated.entityType).toBe('collection')
  })

  test('should leave system instructions empty when none are configured', async ({ payload }) => {
    const { user } = await payload.login({ collection: 'users', data: devUser })
    const doc = await findInstructions({
      payload,
      entitySlug: 'site-settings',
      entityType: 'global',
      user,
    })

    expect(doc.systemInstructions).toBeNull()
  })

  test('should reject anonymous reads and edits', async ({ payload }) => {
    const doc = await saveAdditionalInstructions({
      entitySlug: 'pages',
      entityType: 'collection',
      payload,
    })

    await expect(
      payload.find({ collection: instructionsCollectionSlug, overrideAccess: false, user: null }),
    ).rejects.toThrow()
    await expect(
      payload.update({
        id: doc.id,
        collection: instructionsCollectionSlug,
        data: { additionalInstructions },
        overrideAccess: false,
        user: null,
      }),
    ).rejects.toThrow()
  })

  test('should respect configured access when an authenticated user edits instructions', async ({
    payload,
  }) => {
    const viewer = await payload.create({
      collection: 'users',
      data: { email: 'instructions-viewer@payloadcms.com', password: 'test' },
      overrideAccess: true,
    })
    const user = { ...viewer, collection: 'users' as const }
    const doc = await findInstructions({
      payload,
      entitySlug: 'pages',
      entityType: 'collection',
      user,
    })

    expect(doc.title).toBe('Pages')
    await expect(
      payload.update({
        id: doc.id,
        collection: instructionsCollectionSlug,
        data: { additionalInstructions },
        overrideAccess: false,
        user,
      }),
    ).rejects.toThrow()
  })

  test('should prevent users from creating and deleting configuration-owned entries', async ({
    payload,
  }) => {
    const { user } = await payload.login({ collection: 'users', data: devUser })

    await expect(
      payload.create({
        collection: instructionsCollectionSlug,
        data: { entitySlug: 'pages', entityType: 'collection', title: 'Invented' },
        overrideAccess: false,
        user,
      }),
    ).rejects.toThrow()
    const doc = await findInstructions({
      entitySlug: 'pages',
      entityType: 'collection',
      payload,
      user,
    })

    await expect(
      payload.delete({
        id: doc.id,
        collection: instructionsCollectionSlug,
        overrideAccess: false,
        user,
      }),
    ).rejects.toThrow()
  })
})
