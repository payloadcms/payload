import type { Payload } from 'payload'

import { createPayloadRequest } from 'payload'
import { getLLMInstructions } from 'payload/internal'
import { instructionsCollectionSlug } from 'payload/shared'
import { expect, vi } from 'vitest'

import { test } from '../__helpers/int/vitest.js'
import { devUser } from '../credentials.js'

test.suite('LLM instruction target access', { config: './config.ts' }, () => {
  test.afterEach(() => {
    vi.restoreAllMocks()
  })

  test('should return configured instructions without logging an error when all target reads are denied', async ({
    payload,
  }) => {
    const { user } = await payload.login({ collection: 'users', data: devUser })

    for (const target of [...payload.config.collections, ...payload.config.globals]) {
      if (target.slug !== instructionsCollectionSlug) {
        vi.spyOn(target.access, 'read').mockResolvedValue(false)
      }
    }

    const logger = vi.spyOn(payload.logger, 'error')
    const req = await createPayloadRequest({ payload, user })
    const instructions = await getLLMInstructions({ slug: 'pages', type: 'collection', req })

    expect(instructions).toBe(payload.collections.pages.config.llmInstructions)
    expect(logger).not.toHaveBeenCalled()
  })

  for (const target of [
    { slug: 'pages', type: 'collection' },
    { slug: 'site-settings', type: 'global' },
  ] as const) {
    const id = `${target.type}:${target.slug}`
    const getTargetConfig = ({ payload }: { payload: Payload }) =>
      target.type === 'collection'
        ? payload.collections[target.slug].config
        : payload.config.globals.find(({ slug }) => slug === target.slug)!

    test(`should omit ${target.type} instructions from lists when target read access is denied`, async ({
      payload,
    }) => {
      const { user } = await payload.login({ collection: 'users', data: devUser })

      vi.spyOn(getTargetConfig({ payload }).access, 'read').mockResolvedValue(false)

      const result = await payload.find({
        collection: instructionsCollectionSlug,
        overrideAccess: false,
        pagination: false,
        user,
      })

      expect(result.docs.map(({ id }) => id)).not.toContain(id)
      expect(result.docs.map(({ id }) => id)).toContain('collection:users')
    })

    test(`should deny direct reads of ${target.type} instructions without target read access`, async ({
      payload,
    }) => {
      const { user } = await payload.login({ collection: 'users', data: devUser })

      vi.spyOn(getTargetConfig({ payload }).access, 'read').mockResolvedValue(false)

      await expect(
        payload.findByID({
          id,
          collection: instructionsCollectionSlug,
          overrideAccess: false,
          user,
        }),
      ).rejects.toThrow()
    })

    for (const deniedOperation of ['read', 'update'] as const) {
      test(`should deny editing ${target.type} instructions without target ${deniedOperation} access`, async ({
        payload,
      }) => {
        const { user } = await payload.login({ collection: 'users', data: devUser })

        await payload.findByID({
          id,
          collection: instructionsCollectionSlug,
          overrideAccess: false,
          user,
        })

        vi.spyOn(getTargetConfig({ payload }).access, deniedOperation).mockResolvedValue(false)

        await expect(
          payload.update({
            id,
            collection: instructionsCollectionSlug,
            data: { additionalInstructions: null },
            overrideAccess: false,
            user,
          }),
        ).rejects.toThrow()
      })
    }

    test(`should allow conditional ${target.type} access without applying target document filters to instructions`, async ({
      payload,
    }) => {
      const { user } = await payload.login({ collection: 'users', data: devUser })
      const targetConfig = getTargetConfig({ payload })
      const readAccess = vi
        .spyOn(targetConfig.access, 'read')
        .mockResolvedValue({ title: { equals: 'An accessible document' } })
      const updateAccess = vi
        .spyOn(targetConfig.access, 'update')
        .mockResolvedValue({ title: { equals: 'An editable document' } })
      const doc = await payload.findByID({
        id,
        collection: instructionsCollectionSlug,
        overrideAccess: false,
        user,
      })
      const updated = await payload.update({
        id: doc.id,
        collection: instructionsCollectionSlug,
        data: { additionalInstructions: null },
        overrideAccess: false,
        user,
      })

      expect(updated.id).toBe(id)
      for (const access of [readAccess, updateAccess]) {
        expect(access).toHaveBeenCalledWith(
          expect.objectContaining({ id: undefined, slug: target.slug, data: undefined }),
        )
      }
    })
  }
})
