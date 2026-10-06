/* eslint vitest/no-standalone-expect: ["error", { "additionalTestBlockFunctions": ["test"] }] -- Tests use the shared fixture wrapper. */
import { expect } from 'vitest'

import { test } from '../__helpers/int/vitest.js'
import { localizedPostsSlug } from './slugs.js'

test.suite('Localized version data', { config: './config.ts' }, () => {
  test('should accumulate edits to different draft locales', async ({ payload }) => {
    const doc = await payload.create({
      collection: localizedPostsSlug,
      data: { _status: 'published', title: { en: 'English', fr: 'French' } },
      locale: 'all',
      version: 'published',
    })

    await payload.update({
      id: doc.id,
      collection: localizedPostsSlug,
      data: { title: 'English draft' },
      locale: 'en',
    })
    await payload.update({
      id: doc.id,
      collection: localizedPostsSlug,
      data: { title: 'French draft' },
      locale: 'fr',
    })

    const draft = await payload.findByID({
      id: doc.id,
      collection: localizedPostsSlug,
      locale: 'all',
      version: 'draft',
    })

    expect(draft.title).toEqual({ en: 'English draft', fr: 'French draft' })
    expect(draft._status).toEqual({ en: 'draft', fr: 'draft' })
  })

  test('should publish nested localized groups and arrays with locale all', async ({ payload }) => {
    const doc = await payload.create({
      collection: localizedPostsSlug,
      data: {
        details: { heading: { en: 'English heading', fr: 'French heading' }, note: 'Shared note' },
        localizedRows: { en: [{ label: 'English row' }], fr: [{ label: 'French row' }] },
        rows: [{ label: { en: 'English label', fr: 'French label' }, note: 'Shared row' }],
        title: { en: 'English', fr: 'French' },
      },
      locale: 'all',
    })

    await payload.update({
      id: doc.id,
      collection: localizedPostsSlug,
      data: { _status: 'published' },
      locale: 'all',
    })

    const published = await payload.findByID({
      id: doc.id,
      collection: localizedPostsSlug,
      locale: 'all',
    })

    expect(published.details).toMatchObject({
      heading: { en: 'English heading', fr: 'French heading' },
      note: 'Shared note',
    })
    expect(published.rows).toMatchObject([
      { label: { en: 'English label', fr: 'French label' }, note: 'Shared row' },
    ])
    expect(published.localizedRows).toMatchObject({
      en: [{ label: 'English row' }],
      fr: [{ label: 'French row' }],
    })
  })

  test('should preserve pending shared and nested fields while synchronizing live locales', async ({
    payload,
  }) => {
    const doc = await payload.create({
      collection: localizedPostsSlug,
      data: {
        _status: 'published',
        details: { heading: { en: 'English heading', fr: 'French heading' }, note: 'Live note' },
        summary: 'Live summary',
        title: { en: 'English', fr: 'French' },
      },
      locale: 'all',
      version: 'published',
    })

    await payload.update({
      id: doc.id,
      collection: localizedPostsSlug,
      data: {
        details: { heading: 'French draft heading', note: 'Pending note' },
        summary: 'Pending summary',
        title: 'French draft',
      },
      locale: 'fr',
    })
    await payload.update({
      id: doc.id,
      collection: localizedPostsSlug,
      data: {
        details: { heading: 'English live edit', note: 'Edited live note' },
        summary: 'Edited live summary',
      },
      locale: 'en',
      version: 'published',
    })

    const draft = await payload.findByID({
      id: doc.id,
      collection: localizedPostsSlug,
      locale: 'fr',
      version: 'draft',
    })
    const latest = await payload.find({
      collection: localizedPostsSlug,
      locale: 'en',
      version: 'latest',
      where: { 'details.heading': { equals: 'English live edit' } },
    })

    expect(draft.summary).toBe('Pending summary')
    expect(draft.details).toMatchObject({ heading: 'French draft heading', note: 'Pending note' })
    expect(latest.totalDocs).toBe(1)
  })
})
