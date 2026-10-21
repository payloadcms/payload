import { expect } from 'vitest'

import { test } from '../__helpers/int/vitest.js'
import { articlesSlug, protectedArticlesSlug, settingsSlug } from './slugs.js'

test.suite('Legacy pending schedule contracts', { config: './config.ts' }, () => {
  test('should publish the latest working collection content at execution for one locale', async ({
    payload,
  }) => {
    const article = await payload.create({
      collection: articlesSlug,
      data: { title: 'Queued English' },
      draft: true,
      locale: 'en',
    })

    await payload.update({
      collection: articlesSlug,
      id: article.id,
      data: { title: 'French draft' },
      draft: true,
      locale: 'fr',
    })

    const job = await payload.jobs.queue({
      task: 'schedulePublish',
      overrideAccess: true,
      input: {
        doc: { relationTo: articlesSlug, value: String(article.id) },
        locale: 'en',
        type: 'publish',
      },
      waitUntil: new Date(0),
    })

    await payload.update({
      collection: articlesSlug,
      id: article.id,
      data: { title: 'Edited after queue' },
      draft: true,
      locale: 'en',
    })
    await payload.jobs.run({ overrideAccess: true })

    const live = await payload.findByID({ collection: articlesSlug, id: article.id, locale: 'all' })
    const completed = await payload.findByID({
      collection: 'payload-jobs',
      id: job.id,
      overrideAccess: true,
    })

    expect(live.title).toMatchObject({ en: 'Edited after queue' })
    expect(live._status).toMatchObject({ en: 'published' })
    expect(live._status?.fr).not.toBe('published')
    expect(completed.completedAt).toBeTruthy()
  })

  test('should publish all global locales when a queued job has no locale', async ({ payload }) => {
    await payload.updateGlobal({
      slug: settingsSlug,
      data: { title: 'English' },
      draft: true,
      locale: 'en',
    })
    await payload.updateGlobal({
      slug: settingsSlug,
      data: { title: 'French' },
      draft: true,
      locale: 'fr',
    })
    await payload.jobs.queue({
      task: 'schedulePublish',
      overrideAccess: true,
      input: { global: settingsSlug, type: 'publish' },
      waitUntil: new Date(0),
    })
    await payload.updateGlobal({
      slug: settingsSlug,
      data: { title: 'Latest French' },
      draft: true,
      locale: 'fr',
    })
    await payload.jobs.run({ overrideAccess: true })

    const live = await payload.findGlobal({ slug: settingsSlug, locale: 'all' })

    expect(live.title).toStrictEqual({ en: 'English', fr: 'Latest French' })
    expect(live._status).toStrictEqual({ en: 'published', fr: 'published' })
  })

  test('should retain legacy withdrawal copying newer working content into the inactive locale', async ({
    payload,
  }) => {
    const article = await payload.create({
      collection: articlesSlug,
      data: { _status: 'published', title: 'English live' },
      locale: 'en',
    })

    await payload.update({
      collection: articlesSlug,
      id: article.id,
      data: { _status: 'published', title: 'French live' },
      locale: 'fr',
    })
    await payload.update({
      collection: articlesSlug,
      id: article.id,
      data: { title: 'French working' },
      draft: true,
      locale: 'fr',
    })
    await payload.jobs.queue({
      task: 'schedulePublish',
      overrideAccess: true,
      input: {
        doc: { relationTo: articlesSlug, value: String(article.id) },
        locale: 'fr',
        type: 'unpublish',
      },
      waitUntil: new Date(0),
    })
    await payload.jobs.run({ overrideAccess: true })

    const live = await payload.findByID({ collection: articlesSlug, id: article.id, locale: 'all' })

    expect(live._status).toStrictEqual({ en: 'published', fr: 'draft' })
    expect(live.title).toStrictEqual({ en: 'English live', fr: 'French working' })
  })

  test('should fail closed for legacy actor IDs that omit the auth collection', async ({
    payload,
  }) => {
    const article = await payload.create({
      collection: protectedArticlesSlug,
      overrideAccess: true,
      data: { title: 'Must stay draft' },
      draft: true,
      locale: 'en',
    })
    const user = await payload.create({
      collection: 'users',
      data: { email: 'scheduler@example.com', password: 'test' },
      overrideAccess: true,
    })
    const job = await payload.jobs.queue({
      task: 'schedulePublish',
      overrideAccess: true,
      input: {
        doc: { relationTo: protectedArticlesSlug, value: String(article.id) },
        locale: 'en',
        user: user.id,
      },
      waitUntil: new Date(0),
    })

    await payload.jobs.run({ overrideAccess: true })

    const failed = await payload.findByID({
      collection: 'payload-jobs',
      id: job.id,
      overrideAccess: true,
    })
    const live = await payload.findByID({
      collection: protectedArticlesSlug,
      id: article.id,
      locale: 'en',
      overrideAccess: true,
    })

    expect(failed.completedAt).toBeFalsy()
    expect(failed.totalTried).toBeGreaterThan(0)
    expect(live._status).toBe('draft')
  })

  test('should execute with the typed scheduling actor and fail if that actor is later deleted', async ({
    payload,
  }) => {
    const user = await payload.create({
      collection: 'users',
      data: { email: 'typed-scheduler@example.com', password: 'test' },
      overrideAccess: true,
    })
    const article = await payload.create({
      collection: protectedArticlesSlug,
      data: { title: 'Scheduled by actor' },
      draft: true,
      locale: 'en',
      overrideAccess: true,
    })

    await payload.jobs.queue({
      task: 'schedulePublish',
      input: {
        doc: { relationTo: protectedArticlesSlug, value: String(article.id) },
        locale: 'en',
        user: { relationTo: 'users', value: user.id },
      },
      overrideAccess: true,
      waitUntil: new Date(0),
    })
    await payload.jobs.run({ overrideAccess: true })

    const live = await payload.findByID({
      collection: protectedArticlesSlug,
      id: article.id,
      locale: 'en',
      overrideAccess: true,
    })

    expect(live._status).toBe('published')

    const job = await payload.jobs.queue({
      task: 'schedulePublish',
      input: {
        doc: { relationTo: protectedArticlesSlug, value: String(article.id) },
        locale: 'en',
        type: 'unpublish',
        user: { relationTo: 'users', value: user.id },
      },
      overrideAccess: true,
      waitUntil: new Date(0),
    })

    await payload.delete({ collection: 'users', id: user.id, overrideAccess: true })
    await payload.jobs.run({ overrideAccess: true })

    const failed = await payload.findByID({
      collection: 'payload-jobs',
      id: job.id,
      overrideAccess: true,
    })
    const unchanged = await payload.findByID({
      collection: protectedArticlesSlug,
      id: article.id,
      locale: 'en',
      overrideAccess: true,
    })

    expect(failed.completedAt).toBeFalsy()
    expect(failed.totalTried).toBeGreaterThan(0)
    expect(unchanged._status).toBe('published')
  })

  test('should retain the legacy absent-locale global withdrawal selecting only the default locale', async ({
    payload,
  }) => {
    await payload.updateGlobal({
      slug: settingsSlug,
      data: { _status: 'published', title: 'English live' },
      locale: 'en',
    })
    await payload.updateGlobal({
      slug: settingsSlug,
      data: { _status: 'published', title: 'French live' },
      locale: 'fr',
    })
    await payload.jobs.queue({
      task: 'schedulePublish',
      input: { global: settingsSlug, type: 'unpublish' },
      overrideAccess: true,
      waitUntil: new Date(0),
    })
    await payload.jobs.run({ overrideAccess: true })

    const live = await payload.findGlobal({ slug: settingsSlug, locale: 'all' })

    expect(live._status).toStrictEqual({ en: 'draft', fr: 'published' })
  })
})
