/* eslint vitest/no-standalone-expect: ["error", { "additionalTestBlockFunctions": ["test"] }] -- Tests use the shared fixture wrapper. */
import { expect } from 'vitest'

import { test } from '../__helpers/int/vitest.js'
import { draftGlobalSlug, localizedPostsSlug } from './slugs.js'

test.suite('Restore publication validation', { config: './config.ts' }, () => {
  let originalRequired: boolean | undefined

  test.beforeEach(({ payload }) => {
    const title = payload.collections[localizedPostsSlug].config.fields.find(
      (field) => 'name' in field && field.name === 'title',
    )!

    originalRequired = title.required
    title.required = true
  })

  test.afterEach(({ payload }) => {
    const title = payload.collections[localizedPostsSlug].config.fields.find(
      (field) => 'name' in field && field.name === 'title',
    )!

    title.required = originalRequired
    if (payload.config.localization) {
      delete payload.config.localization.filterAvailableLocales
    }
    const globalTitle = payload.globals.config
      .find((global) => global.slug === draftGlobalSlug)!
      .fields.find((field) => 'name' in field && field.name === 'title')!
    globalTitle.hooks.afterRead = []
  })

  test('should preserve stored global values and run read hooks only for responses', async ({
    payload,
  }) => {
    await payload.updateGlobal({
      slug: draftGlobalSlug,
      locale: 'all',
      data: { title: { en: 'Stored English', fr: 'Stored French' }, _status: 'published' },
    })
    const versions = await payload.findGlobalVersions({
      slug: draftGlobalSlug,
      where: { latest: { equals: true } },
    })
    const title = payload.globals.config
      .find((global) => global.slug === draftGlobalSlug)!
      .fields.find((field) => 'name' in field && field.name === 'title')!
    let restoringReadCalls = 0
    title.hooks.afterRead = [
      ({ value, req }) => {
        if (req.context.isRestoringVersion) {
          restoringReadCalls++
        }
        return typeof value === 'string' ? `${value}!` : value
      },
    ]
    await payload.restoreGlobalVersion({
      slug: draftGlobalSlug,
      id: versions.docs[0]!.id,
      locale: 'en',
      version: 'published',
    })
    const stored = await payload.db.findGlobal({ slug: draftGlobalSlug })
    expect(stored.title).toEqual({ en: 'Stored English', fr: 'Stored French' })
    expect(restoringReadCalls).toBe(1)
  })

  for (const isGlobal of [false, true]) {
    for (const scenario of [
      'invalid publication',
      'excluded invalid publication',
      'valid publication',
      'invalid draft',
    ] as const) {
      test(`should ${scenario.includes('invalid publication') ? 'reject' : 'allow'} ${scenario} during ${isGlobal ? 'global' : 'collection'} restore`, async ({
        payload,
      }) => {
        const title = { en: 'Live English', fr: 'Live French' }
        const live = isGlobal
          ? await payload.updateGlobal({
              slug: draftGlobalSlug,
              locale: 'all',
              data: { title, _status: 'published' },
            })
          : await payload.create({
              collection: localizedPostsSlug,
              locale: 'all',
              data: { title },
              version: 'published',
            })
        const pendingTitle = scenario === 'valid publication' ? 'Pending French' : ''

        if (isGlobal) {
          await payload.updateGlobal({
            slug: draftGlobalSlug,
            locale: 'fr',
            data: { title: pendingTitle },
          })
        } else {
          await payload.update({
            collection: localizedPostsSlug,
            id: live.id,
            locale: 'fr',
            data: { title: pendingTitle },
          })
        }
        const versions = isGlobal
          ? await payload.findGlobalVersions({
              slug: draftGlobalSlug,
              where: { latest: { equals: true } },
            })
          : await payload.findVersions({
              collection: localizedPostsSlug,
              where: { and: [{ parent: { equals: live.id } }, { latest: { equals: true } }] },
            })
        const version = scenario === 'invalid draft' ? 'draft' : 'published'
        if (scenario === 'excluded invalid publication' && payload.config.localization) {
          payload.config.localization.filterAvailableLocales = ({ locales }) =>
            locales.filter((locale) => locale.code === 'en')
        }
        const restore = isGlobal
          ? payload.restoreGlobalVersion({
              slug: draftGlobalSlug,
              id: versions.docs[0]!.id,
              locale: 'all',
              version,
            })
          : payload.restoreVersion({
              collection: localizedPostsSlug,
              id: versions.docs[0]!.id,
              locale: 'all',
              version,
            })

        const outcome = await restore.then(
          (restored) => ({ title: restored.title }),
          (error: { status?: number }) => ({ errorStatus: error.status }),
        )

        expect(outcome).toEqual(
          scenario.includes('invalid publication')
            ? { errorStatus: 400 }
            : { title: { en: 'Live English', fr: pendingTitle } },
        )
        const published = isGlobal
          ? await payload.findGlobal({ slug: draftGlobalSlug, locale: 'all' })
          : await payload.findByID({ collection: localizedPostsSlug, id: live.id, locale: 'all' })

        expect(published.title).toEqual({
          en: 'Live English',
          fr: scenario === 'valid publication' ? 'Pending French' : 'Live French',
        })
      })
    }
  }
})
