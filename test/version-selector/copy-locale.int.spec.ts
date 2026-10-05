/* eslint vitest/no-standalone-expect: ["error", { "additionalTestBlockFunctions": ["test"] }] -- Integration tests use the shared fixture wrapper. */
import { createPayloadRequest } from 'payload'
import { expect } from 'vitest'

// eslint-disable-next-line payload/no-relative-monorepo-imports -- Exercise the Admin server action against the real Local API.
import { copyDataFromLocale } from '../../packages/ui/src/utilities/copyDataFromLocale.js'
import { test } from '../__helpers/int/vitest.js'
import { devUser } from '../credentials.js'
import {
  draftGlobalSlug,
  localizedPostsSlug,
  plainGlobalSlug,
  plainLocalizedPostsSlug,
} from './slugs.js'

test.suite('Copy locale version selection', { config: './config.ts' }, () => {
  for (const hasDrafts of [false, true]) {
    for (const isGlobal of [false, true]) {
      test(`should copy locale data in ${isGlobal ? 'globals' : 'collections'} with drafts ${hasDrafts ? 'enabled' : 'disabled'}`, async ({
        payload,
      }) => {
        const collection = hasDrafts ? localizedPostsSlug : plainLocalizedPostsSlug
        const slug = hasDrafts ? draftGlobalSlug : plainGlobalSlug
        const created = isGlobal
          ? await payload.updateGlobal({
              slug,
              data: {
                title: { en: 'English source', fr: 'French live' },
                ...(hasDrafts ? { _status: 'published' } : {}),
              },
              locale: 'all',
              ...(hasDrafts ? { version: 'draft' as const } : {}),
            })
          : await payload.create({
              collection,
              data: { title: { en: 'English source', fr: 'French live' } },
              locale: 'all',
              version: 'published',
            })
        await payload.create({ collection: 'users', data: devUser, overrideAccess: true })
        const { user } = await payload.login({
          collection: 'users',
          data: { email: devUser.email, password: devUser.password },
        })
        const req = await createPayloadRequest({ payload, user })

        await copyDataFromLocale({
          ...(isGlobal ? { globalSlug: slug } : { collectionSlug: collection, docID: created.id }),
          fromLocale: 'en',
          overrideData: true,
          req,
          toLocale: 'fr',
        })
        const latest = isGlobal
          ? await payload.findGlobal({ slug, locale: 'fr', version: 'latest' })
          : await payload.findByID({ id: created.id, collection, locale: 'fr', version: 'latest' })
        const published = isGlobal
          ? await payload.findGlobal({ slug, locale: 'fr' })
          : await payload.findByID({ id: created.id, collection, locale: 'fr' })

        expect(latest.title).toBe('English source')
        expect(published.title).toBe(hasDrafts ? 'French live' : 'English source')
      })
    }
  }

  test('should reject a locale copy when the authenticated user cannot update the collection', async ({
    payload,
  }) => {
    const created = await payload.create({
      collection: plainLocalizedPostsSlug,
      data: { title: 'English source' },
    })
    await payload.create({ collection: 'users', data: devUser, overrideAccess: true })
    const { user } = await payload.login({
      collection: 'users',
      data: { email: devUser.email, password: devUser.password },
    })
    const access = payload.collections[plainLocalizedPostsSlug].config.access
    const previousUpdate = access.update

    access.update = ({ req }) => req.user?.id !== user.id
    try {
      await expect(
        copyDataFromLocale({
          collectionSlug: plainLocalizedPostsSlug,
          docID: created.id,
          fromLocale: 'en',
          overrideData: true,
          req: await createPayloadRequest({ payload, user }),
          toLocale: 'fr',
        }),
      ).rejects.toMatchObject({ status: 403 })
      expect(
        (
          await payload.findByID({
            id: created.id,
            collection: plainLocalizedPostsSlug,
            fallbackLocale: false,
            locale: 'fr',
          })
        ).title,
      ).toBeFalsy()
    } finally {
      access.update = previousUpdate
    }
  })
})
