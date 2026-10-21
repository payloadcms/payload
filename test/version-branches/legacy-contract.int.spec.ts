import { expect } from 'vitest'

import { test } from '../__helpers/int/vitest.js'
import { articlesSlug, settingsSlug } from './slugs.js'

test.suite('Existing drafts contracts for branch head migration', { config: './config.ts' }, () => {
  test('should keep working content separate from the materialized collection row', async ({
    payload,
  }) => {
    const article = await payload.create({
      collection: articlesSlug,
      data: { _status: 'published', shared: 'shared-live', title: 'live' },
      locale: 'en',
    })

    await payload.update({
      id: article.id,
      collection: articlesSlug,
      data: { shared: 'shared-working', title: 'working' },
      draft: true,
      locale: 'en',
    })

    const materialized = await payload.db.findOne({
      collection: articlesSlug,
      locale: 'all',
      where: { id: { equals: article.id } },
    })
    const working = await payload.findByID({
      id: article.id,
      collection: articlesSlug,
      draft: true,
      fallbackLocale: false,
      locale: 'en',
    })

    expect(materialized).toMatchObject({ shared: 'shared-live', title: { en: 'live' } })
    expect(working).toMatchObject({ shared: 'shared-working', title: 'working' })
  })

  test('should preserve the identity anchor and incomplete content for a new draft', async ({
    payload,
  }) => {
    const article = await payload.create({
      collection: articlesSlug,
      data: { shared: 'incomplete' },
      draft: true,
      locale: 'en',
    })
    const materialized = await payload.db.findOne({
      collection: articlesSlug,
      locale: 'all',
      where: { id: { equals: article.id } },
    })
    const working = await payload.findByID({
      id: article.id,
      collection: articlesSlug,
      draft: true,
      locale: 'en',
    })

    expect(materialized?.id).toBe(article.id)
    expect(materialized?._status).toMatchObject({ en: 'draft' })
    expect(working.shared).toBe('incomplete')
    expect(working.title).toBeFalsy()
  })

  test('should publish one locale without replacing another locales working content', async ({
    payload,
  }) => {
    const article = await payload.create({
      collection: articlesSlug,
      data: { _status: 'published', shared: 'shared-live', title: 'English live' },
      locale: 'en',
    })

    await payload.update({
      id: article.id,
      collection: articlesSlug,
      data: { _status: 'published', title: 'French live' },
      locale: 'fr',
    })
    await payload.update({
      id: article.id,
      collection: articlesSlug,
      data: { title: 'French working' },
      draft: true,
      locale: 'fr',
    })
    await payload.update({
      id: article.id,
      collection: articlesSlug,
      data: { title: 'English ready' },
      draft: true,
      locale: 'en',
    })
    await payload.update({
      id: article.id,
      collection: articlesSlug,
      data: { _status: 'published' },
      locale: 'en',
    })

    const live = await payload.findByID({
      id: article.id,
      collection: articlesSlug,
      fallbackLocale: false,
      locale: 'all',
    })
    const frenchWorking = await payload.findByID({
      id: article.id,
      collection: articlesSlug,
      draft: true,
      fallbackLocale: false,
      locale: 'fr',
    })

    expect(live.title).toStrictEqual({ en: 'English ready', fr: 'French live' })
    expect(frenchWorking.title).toBe('French working')
    expect(live._status).toStrictEqual({ en: 'published', fr: 'published' })
  })

  test('should publish all locales from the working view', async ({ payload }) => {
    const article = await payload.create({
      collection: articlesSlug,
      data: { title: 'English draft' },
      draft: true,
      locale: 'en',
    })

    await payload.update({
      id: article.id,
      collection: articlesSlug,
      data: { title: 'French draft' },
      draft: true,
      locale: 'fr',
    })
    await payload.update({
      id: article.id,
      collection: articlesSlug,
      data: { _status: 'published' },
      locale: 'en',
      publishAllLocales: true,
    })

    const live = await payload.findByID({ id: article.id, collection: articlesSlug, locale: 'all' })

    expect(live.title).toStrictEqual({ en: 'English draft', fr: 'French draft' })
    expect(live._status).toStrictEqual({ en: 'published', fr: 'published' })
  })

  test('should withdraw one locale while retaining another published locale', async ({
    payload,
  }) => {
    const article = await payload.create({
      collection: articlesSlug,
      data: { _status: 'published', title: 'English live' },
      locale: 'en',
    })

    await payload.update({
      id: article.id,
      collection: articlesSlug,
      data: { _status: 'published', title: 'French live' },
      locale: 'fr',
    })
    await payload.update({
      id: article.id,
      collection: articlesSlug,
      data: { _status: 'draft' },
      locale: 'fr',
    })

    const live = await payload.findByID({ id: article.id, collection: articlesSlug, locale: 'all' })

    expect(live._status).toStrictEqual({ en: 'published', fr: 'draft' })
    expect(live.title).toStrictEqual({ en: 'English live', fr: 'French live' })
  })

  test('should coalesce repeated exclusive autosaves without changing live content', async ({
    payload,
  }) => {
    const article = await payload.create({
      collection: articlesSlug,
      data: { _status: 'published', title: 'live' },
      locale: 'en',
    })

    await payload.update({
      id: article.id,
      autosave: true,
      collection: articlesSlug,
      data: { title: 'first autosave' },
      draft: true,
      locale: 'en',
    })

    const first = await payload.findVersions({
      collection: articlesSlug,
      sort: '-updatedAt',
      where: { parent: { equals: article.id } },
    })

    await payload.update({
      id: article.id,
      autosave: true,
      collection: articlesSlug,
      data: { title: 'second autosave' },
      draft: true,
      locale: 'en',
    })

    const second = await payload.findVersions({
      collection: articlesSlug,
      sort: '-updatedAt',
      where: { parent: { equals: article.id } },
    })
    const live = await payload.findByID({ id: article.id, collection: articlesSlug, locale: 'en' })

    expect(second.totalDocs).toBe(first.totalDocs)
    expect(second.docs[0]?.id).toBe(first.docs[0]?.id)
    expect(second.docs[0]?.version.title).toBe('second autosave')
    expect(live.title).toBe('live')
  })

  test('should restore the selected published version through the Local API', async ({
    payload,
  }) => {
    const article = await payload.create({
      collection: articlesSlug,
      data: { _status: 'published', title: 'original' },
      locale: 'en',
    })
    const versions = await payload.findVersions({
      collection: articlesSlug,
      where: { parent: { equals: article.id } },
    })

    await payload.update({
      id: article.id,
      collection: articlesSlug,
      data: { _status: 'published', title: 'current' },
      locale: 'en',
    })
    await payload.restoreVersion({
      id: versions.docs[0]!.id,
      collection: articlesSlug,
      locale: 'en',
    })

    const working = await payload.findByID({
      id: article.id,
      collection: articlesSlug,
      draft: true,
      locale: 'en',
    })
    const live = await payload.findByID({ id: article.id, collection: articlesSlug, locale: 'en' })

    expect(working.title).toBe('original')
    expect(live.title).toBe('original')
  })

  test('should preserve global working content separately from the materialized global', async ({
    payload,
  }) => {
    await payload.updateGlobal({
      slug: settingsSlug,
      data: { _status: 'published', shared: 'shared-live', title: 'live global' },
      locale: 'en',
    })
    await payload.updateGlobal({
      slug: settingsSlug,
      data: { shared: 'shared-working', title: 'working global' },
      draft: true,
      locale: 'en',
    })

    const live = await payload.db.findGlobal({ slug: settingsSlug, locale: 'all' })
    const working = await payload.findGlobal({ slug: settingsSlug, draft: true, locale: 'en' })

    expect(live).toMatchObject({ shared: 'shared-live', title: { en: 'live global' } })
    expect(working).toMatchObject({ shared: 'shared-working', title: 'working global' })
  })

  test('should honor draft mode when restoring a collection version through the Local API', async ({
    payload,
  }) => {
    const article = await payload.create({
      collection: articlesSlug,
      data: { _status: 'published', title: 'original' },
      locale: 'en',
    })
    const versions = await payload.findVersions({
      collection: articlesSlug,
      where: { parent: { equals: article.id } },
    })

    await payload.update({
      id: article.id,
      collection: articlesSlug,
      data: { _status: 'published', title: 'current live' },
      locale: 'en',
    })
    await payload.restoreVersion({
      id: versions.docs[0]!.id,
      collection: articlesSlug,
      draft: true,
      locale: 'en',
    })

    const materialized = await payload.db.findOne({
      collection: articlesSlug,
      locale: 'all',
      where: { id: { equals: article.id } },
    })
    const working = await payload.findByID({
      id: article.id,
      collection: articlesSlug,
      draft: true,
      locale: 'en',
    })

    expect(working.title).toBe('original')
    expect(materialized?.title).toMatchObject({ en: 'current live' })
    expect(materialized?._status).toMatchObject({ en: 'published' })
  })
  test('should restore a global version into materialized storage in the legacy Local API', async ({
    payload,
  }) => {
    await payload.updateGlobal({
      slug: settingsSlug,
      data: { _status: 'published', title: 'Original global' },
      locale: 'en',
    })

    const versions = await payload.findGlobalVersions({ slug: settingsSlug, locale: 'en' })

    await payload.updateGlobal({
      slug: settingsSlug,
      data: { _status: 'published', title: 'Current global' },
      locale: 'en',
    })
    await payload.restoreGlobalVersion({
      slug: settingsSlug,
      id: String(versions.docs[0]!.id),
      locale: 'en',
      overrideAccess: true,
    })

    const materialized = await payload.db.findGlobal({ slug: settingsSlug, locale: 'all' })

    // The legacy Local API has no draft option. M4 must intentionally add working-only restoration.
    expect(materialized?.title).toMatchObject({ en: 'Original global' })
    expect(materialized?._status).toMatchObject({ en: 'published' })
  })

  test('should reject incomplete publication while allowing incomplete draft saves', async ({
    payload,
  }) => {
    const article = await payload.create({
      collection: articlesSlug,
      data: { shared: 'Incomplete' },
      draft: true,
      locale: 'en',
    })

    await expect(
      payload.update({
        collection: articlesSlug,
        id: article.id,
        data: { _status: 'published' },
        locale: 'en',
      }),
    ).rejects.toMatchObject({ status: 400 })

    const working = await payload.findByID({
      collection: articlesSlug,
      id: article.id,
      draft: true,
      locale: 'en',
    })

    expect(working.shared).toBe('Incomplete')
    expect(working._status).toBe('draft')
  })
})
