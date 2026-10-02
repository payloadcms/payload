import { createPayloadRequest, initTransaction, killTransaction } from 'payload'
import { getLLMInstructions } from 'payload/internal'
import { instructionsCollectionSlug } from 'payload/shared'
import { expect, onTestFinished } from 'vitest'

import { test } from '../__helpers/int/vitest.js'
import { devUser } from '../credentials.js'
import { additionalInstructions, findInstructions, saveAdditionalInstructions } from './helpers.js'
import { hiddenCollectionSlug, hiddenGlobalSlug } from './slugs.js'

test.suite('LLM instructions', { config: './config.ts' }, () => {
  for (const field of ['collectionSlug', 'globalSlug']) {
    test(`should allow querying ${field} with a slug outside the configured targets`, async ({
      payload,
    }) => {
      const result = await payload.find({
        collection: instructionsCollectionSlug,
        overrideAccess: true,
        where: { [field]: { equals: 'removed-target' } },
      })

      expect(result.docs).toEqual([])
    })
  }

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

    await saveAdditionalInstructions({ collectionSlug: 'pages', payload })

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
    { collectionSlug: 'unknown-collection' },
    { globalSlug: 'unknown-global' },
    { collectionSlug: hiddenCollectionSlug },
    { globalSlug: hiddenGlobalSlug },
    { collectionSlug: instructionsCollectionSlug },
  ]) {
    test(`should reject creating instructions for non-target ${JSON.stringify(data)}`, async ({
      payload,
    }) => {
      await expect(
        payload.create({ collection: instructionsCollectionSlug, data, overrideAccess: true }),
      ).rejects.toMatchObject({
        name: 'ValidationError',
        data: { errors: [expect.objectContaining({ path: Object.keys(data)[0] })] },
      })
    })
  }

  for (const target of [
    { slug: 'pages', type: 'collection', collectionSlug: 'pages' },
    { slug: 'site-settings', type: 'global', globalSlug: 'site-settings' },
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
          collectionSlug: 'pages',
          type: 'collection',
          title: 'Pages',
        }),
        expect.objectContaining({
          id: 'global-site-settings',
          globalSlug: 'site-settings',
          type: 'global',
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

  test('should preserve Request properties while isolating sync context', async ({ payload }) => {
    const { user } = await payload.login({ collection: 'users', data: devUser })
    const request = new Request('https://example.test/api/mcp', {
      headers: { 'x-request-id': 'instructions-sync' },
      method: 'POST',
    })
    const req = await createPayloadRequest({
      context: { caller: true },
      payload,
      req: request,
      user,
    })
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

    await payload.find({ collection: instructionsCollectionSlug, overrideAccess: false, req })

    expect(syncRequests.length).toBeGreaterThan(0)
    for (const syncRequest of syncRequests) {
      expect(syncRequest).toEqual({
        header: 'instructions-sync',
        method: 'POST',
        url: request.url,
      })
    }
    expect(req.context).toEqual({ caller: true })
  })

  test.options(
    'should keep shared sync results when the first caller rolls back its transaction',
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
          req,
        }),
        payload.find({
          collection: instructionsCollectionSlug,
          depth: 0,
          overrideAccess: false,
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
      select: { title: true, type: true, additionalInstructions: true },
      user,
      where: { collectionSlug: { equals: 'pages' } },
    })

    expect(docs).toEqual([expect.objectContaining({ title: 'Pages', type: 'collection' })])
  })

  test('should allow a null unused slug for multiple targets', async ({ payload }) => {
    const pages = await payload.create({
      collection: instructionsCollectionSlug,
      data: { collectionSlug: 'pages', globalSlug: null },
      overrideAccess: true,
    })
    const users = await payload.create({
      collection: instructionsCollectionSlug,
      data: { collectionSlug: 'users', globalSlug: null },
      overrideAccess: true,
    })

    expect(pages.collectionSlug).toBe('pages')
    expect(users.collectionSlug).toBe('users')
  })

  test('should prevent changing a configuration-owned target', async ({ payload }) => {
    const { user } = await payload.login({ collection: 'users', data: devUser })
    const doc = await findInstructions({ collectionSlug: 'pages', payload, user })

    await expect(
      payload.update({
        id: doc.id,
        collection: instructionsCollectionSlug,
        data: { collectionSlug: null, globalSlug: 'site-settings' },
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

  for (const { name, data } of [
    { name: 'neither target', data: {} },
    { name: 'null targets', data: { collectionSlug: null, globalSlug: null } },
    { name: 'both targets', data: { collectionSlug: 'pages', globalSlug: 'site-settings' } },
  ] as const) {
    test(`should reject creating instructions with ${name}`, async ({ payload }) => {
      await expect(
        payload.create({ collection: instructionsCollectionSlug, data, overrideAccess: true }),
      ).rejects.toMatchObject({
        name: 'ValidationError',
        data: {
          errors: expect.arrayContaining([
            expect.objectContaining({
              message: 'Provide exactly one of collectionSlug or globalSlug.',
            }),
          ]),
        },
      })
    })
  }

  for (const { name, data } of [
    { name: 'neither target', data: { collectionSlug: null } },
    { name: 'an empty target', data: { collectionSlug: '' } },
    { name: 'both targets', data: { globalSlug: 'site-settings' } },
  ] as const) {
    test(`should reject updating instructions to ${name}`, async ({ payload }) => {
      const { user } = await payload.login({ collection: 'users', data: devUser })
      const doc = await findInstructions({ collectionSlug: 'pages', payload, user })

      await expect(
        payload.update({
          id: doc.id,
          collection: instructionsCollectionSlug,
          data,
          overrideAccess: false,
          user,
        }),
      ).rejects.toMatchObject({
        name: 'ValidationError',
        data: {
          errors: expect.arrayContaining([
            expect.objectContaining({
              message: 'Provide exactly one of collectionSlug or globalSlug.',
            }),
          ]),
        },
      })
    })
  }

  for (const target of [{ collectionSlug: 'pages' }, { globalSlug: 'site-settings' }] as const) {
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
      collectionSlug: 'pages',
      user,
    })
    const updated = await payload.update({
      id: original.id,
      collection: instructionsCollectionSlug,
      data: { type: 'global', systemInstructions: additionalInstructions, title: 'Changed title' },
      overrideAccess: false,
      user,
    })

    expect(updated.systemInstructions).toEqual(original.systemInstructions)
    expect(updated.title).toBe('Pages')
    expect(updated.type).toBe('collection')
  })

  test('should leave system instructions empty when none are configured', async ({ payload }) => {
    const { user } = await payload.login({ collection: 'users', data: devUser })
    const doc = await findInstructions({
      payload,
      globalSlug: 'site-settings',
      user,
    })

    expect(doc.systemInstructions).toBeNull()
  })

  test('should reject anonymous reads and edits', async ({ payload }) => {
    const doc = await saveAdditionalInstructions({ collectionSlug: 'pages', payload })

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
      collectionSlug: 'pages',
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
        data: { collectionSlug: 'pages', title: 'Invented' },
        overrideAccess: false,
        user,
      }),
    ).rejects.toThrow()
    const doc = await findInstructions({ collectionSlug: 'pages', payload, user })

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
