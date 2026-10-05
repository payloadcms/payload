/* eslint vitest/no-standalone-expect: ["error", { "additionalTestBlockFunctions": ["test"] }] -- Tests use the shared fixture wrapper. */
import type { Payload } from 'payload'

import { expect } from 'vitest'

import { test } from '../__helpers/int/vitest.js'
import { localizedPostsSlug } from './slugs.js'

test.suite('Localized latest version queries', { config: './config.ts' }, () => {
  test('should filter against the current published locale while another locale is drafted', async ({
    payload,
  }) => {
    const doc = await createLocalizedPendingDraft({ payload, title: 'Corrected' })

    const corrected = await payload.find({
      collection: localizedPostsSlug,
      locale: 'en',
      version: 'latest',
      where: { title: { equals: 'Corrected' } },
    })
    const stale = await payload.find({
      collection: localizedPostsSlug,
      locale: 'en',
      version: 'latest',
      where: { title: { equals: 'Original' } },
    })

    expect(corrected.docs.map(({ id }) => id)).toEqual([doc.id])
    expect(corrected.totalDocs).toBe(1)
    expect(stale.totalDocs).toBe(0)
  })

  test('should retain another locale pending content when latest updates a published locale', async ({
    payload,
  }) => {
    const doc = await createLocalizedPendingDraft({ payload, title: 'Corrected' })

    await payload.update({
      id: doc.id,
      collection: localizedPostsSlug,
      data: { title: 'Latest English correction' },
      locale: 'en',
      version: 'latest',
    })

    const latest = await payload.findByID({
      id: doc.id,
      collection: localizedPostsSlug,
      locale: 'all',
      version: 'latest',
    })
    const pending = await payload.findByID({
      id: doc.id,
      collection: localizedPostsSlug,
      locale: 'fr',
      version: 'draft',
    })
    const published = await payload.findByID({
      id: doc.id,
      collection: localizedPostsSlug,
      locale: 'all',
      version: 'published',
    })

    expect(latest.title).toEqual({ en: 'Latest English correction', fr: 'French pending' })
    expect(pending.title).toBe('French pending')
    expect(published.title).toEqual({ en: 'Latest English correction', fr: 'French' })
  })

  test('should sort and paginate against the current published locale', async ({ payload }) => {
    const first = await createLocalizedPendingDraft({ payload, title: 'Alpha' })
    await createLocalizedPendingDraft({ payload, title: 'Zulu' })

    const result = await payload.find({
      collection: localizedPostsSlug,
      limit: 1,
      locale: 'en',
      sort: 'title',
      version: 'latest',
      where: { title: { not_equals: 'Original' } },
    })

    expect(result.docs.map(({ id }) => id)).toEqual([first.id])
    expect(result.totalDocs).toBe(2)
    expect(result.totalPages).toBe(2)
    expect(result.hasNextPage).toBe(true)
  })

  test('should apply query access to the effective locale version', async ({ payload }) => {
    const doc = await createLocalizedPendingDraft({ payload, title: 'Authorized' })

    const result = await payload.find({
      collection: localizedPostsSlug,
      context: { versionQueryTitle: 'Authorized' },
      locale: 'en',
      overrideAccess: false,
      version: 'latest',
    })

    expect(result.docs.map(({ id }) => id)).toEqual([doc.id])
    expect(result.totalDocs).toBe(1)
  })

  test('should query the effective values of every locale', async ({ payload }) => {
    const doc = await createLocalizedPendingDraft({ payload, title: 'Corrected' })

    const result = await payload.find({
      collection: localizedPostsSlug,
      locale: 'all',
      version: 'latest',
      where: {
        and: [
          { 'title.en': { equals: 'Corrected' } },
          { 'title.fr': { equals: 'French pending' } },
        ],
      },
    })

    expect(result.docs.map(({ id }) => id)).toEqual([doc.id])
    expect(result.docs[0].title).toEqual({ en: 'Corrected', fr: 'French pending' })
    expect(result.totalDocs).toBe(1)
  })
})

async function createLocalizedPendingDraft({
  payload,
  title,
}: {
  payload: Payload
  title: string
}) {
  const doc = await payload.create({
    collection: localizedPostsSlug,
    data: { _status: 'published', title: { en: 'Original', fr: 'French' } },
    locale: 'all',
    version: 'published',
  })

  await payload.update({
    id: doc.id,
    collection: localizedPostsSlug,
    data: { title: 'French pending' },
    locale: 'fr',
    version: 'draft',
  })
  await payload.update({
    id: doc.id,
    collection: localizedPostsSlug,
    data: { title },
    locale: 'en',
    version: 'published',
  })

  return doc
}
