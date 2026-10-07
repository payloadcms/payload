/* eslint vitest/no-standalone-expect: ["error", { "additionalTestBlockFunctions": ["test"] }] -- Tests use the shared fixture wrapper. */
import { fileURLToPath } from 'node:url'
import { createPayloadRequest } from 'payload'
import { PREFERENCE_KEYS } from 'payload/shared'
import { expect } from 'vitest'

// eslint-disable-next-line payload/no-relative-monorepo-imports -- Exercise the internal server handler against the real database.
import { getDashboardDocuments } from '../../packages/ui/src/widgets/RecentlyViewed/getDocuments.js'
import { test } from '../__helpers/int/vitest.js'

test.suite('Dashboard upload thumbnails', { config: './config.ts' }, () => {
  const uploadIDs: Array<number | string> = []

  test.afterEach(async ({ payload }) => {
    for (const id of uploadIDs.splice(0)) {
      await payload.delete({ id, collection: 'media', overrideAccess: true })
    }
  })

  test('should populate thumbnail metadata despite a minimal upload defaultPopulate', async ({
    payload,
  }) => {
    const owner = await payload.create({
      collection: 'users',
      data: { email: 'thumbnail-pages@payloadcms.com', password: 'test' },
      overrideAccess: true,
    })
    const user = { ...owner, collection: 'users' as const }
    const media = await payload.create({
      collection: 'media',
      data: {},
      filePath: fileURLToPath(new URL('../select/image.jpg', import.meta.url)),
      overrideAccess: false,
      user,
    })

    uploadIDs.push(media.id)
    expect(media.thumbnailURL || media.url).toBeTruthy()
    const document = await payload.create({
      collection: 'draft-posts',
      data: { cover: media.id, title: 'Thumbnail with limited population' },
      draft: true,
      overrideAccess: false,
      user,
    })

    for (const key of [PREFERENCE_KEYS.PINNED_DOCUMENTS, PREFERENCE_KEYS.RECENTLY_VIEWED]) {
      await payload.create({
        collection: 'payload-preferences',
        data: { key, value: { items: [{ id: document.id, collectionSlug: 'draft-posts' }] } },
        overrideAccess: false,
        user,
      })
    }
    const req = await createPayloadRequest({ payload, req: { user } })

    for (const tab of ['pinned', 'recents'] as const) {
      const result = await getDashboardDocuments({ limit: 4, page: 1, req, tab })

      expect(result.items).toHaveLength(1)
      expect(result.items[0].thumbnailURL).toBe(media.thumbnailURL || media.url)
    }
  })
})
