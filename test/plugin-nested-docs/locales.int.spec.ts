/* eslint vitest/no-standalone-expect: ["error", { "additionalTestBlockFunctions": ["test"] }] -- Integration tests use the shared fixture wrapper. */
import { expect } from 'vitest'

import { test } from '../__helpers/int/vitest.js'
import { pagesSlug } from './shared.js'

test.suite('Nested document locale maps', { config: './locale-config.ts' }, () => {
  for (const version of ['published', 'draft'] as const) {
    test(`should build localized ancestor breadcrumbs and repair IDs for an all-locale ${version} create`, async ({
      payload,
    }) => {
      const parent = await payload.create({
        collection: pagesSlug,
        locale: 'all',
        version,
        data: {
          title: { en: 'Parent', fr: 'Parent français' },
          slug: { en: 'parent', fr: 'parent-fr' },
        },
      })
      const child = await payload.create({
        collection: pagesSlug,
        locale: 'all',
        version,
        data: {
          parent: parent.id,
          title: { en: 'Child', fr: 'Enfant' },
          slug: { en: 'child', fr: 'enfant' },
        },
      })
      const stored = await payload.findByID({
        collection: pagesSlug,
        id: child.id,
        locale: 'all',
        version,
      })

      expect(stored._status).toEqual({ en: version, fr: version })
      expect(stored.breadcrumbs).toMatchObject({
        en: [
          { doc: parent.id, label: 'Parent', url: '/parent' },
          { doc: child.id, label: 'Child', url: '/parent/child' },
        ],
        fr: [
          { doc: parent.id, label: 'Parent français', url: '/parent-fr' },
          { doc: child.id, label: 'Enfant', url: '/parent-fr/enfant' },
        ],
      })
      const latest = await payload.findByID({
        collection: pagesSlug,
        id: child.id,
        locale: 'all',
        version: 'latest',
      })
      expect(latest._status).toEqual({ en: version, fr: version })
      expect(latest.breadcrumbs).toEqual(stored.breadcrumbs)
    })
  }

  test('should resave localized child breadcrumbs when published ancestors change in all locales', async ({
    payload,
  }) => {
    const parent = await payload.create({
      collection: pagesSlug,
      locale: 'all',
      version: 'published',
      data: {
        title: { en: 'Parent', fr: 'Parent français' },
        slug: { en: 'parent', fr: 'parent-fr' },
      },
    })
    const child = await payload.create({
      collection: pagesSlug,
      locale: 'all',
      version: 'published',
      data: {
        parent: parent.id,
        title: { en: 'Child', fr: 'Enfant' },
        slug: { en: 'child', fr: 'enfant' },
      },
    })
    await payload.update({
      collection: pagesSlug,
      id: parent.id,
      locale: 'all',
      version: 'published',
      data: { slug: { en: 'updated', fr: 'modifie' } },
    })
    const stored = await payload.findByID({ collection: pagesSlug, id: child.id, locale: 'all' })

    expect(stored.breadcrumbs).toMatchObject({
      en: [{ url: '/updated' }, { doc: child.id, url: '/updated/child' }],
      fr: [{ url: '/modifie' }, { doc: child.id, url: '/modifie/enfant' }],
    })
  })

  test('should preserve mixed locale publication states during ID repair', async ({ payload }) => {
    const status = payload.collections[pagesSlug].config.fields.find(
      (field) => 'name' in field && field.name === '_status',
    )!
    const previousHooks = status.hooks
    status.hooks = {
      ...previousHooks,
      beforeChange: [
        ({ operation, req, value }) =>
          operation === 'create' && req.locale === 'en' ? 'draft' : value,
      ],
    }
    try {
      const child = await payload.create({
        collection: pagesSlug,
        locale: 'all',
        version: 'published',
        data: {
          title: { en: 'Draft child', fr: 'Enfant publié' },
          slug: { en: 'draft-child', fr: 'enfant-publie' },
        },
      })
      const stored = await payload.findByID({
        collection: pagesSlug,
        id: child.id,
        locale: 'all',
        version: 'latest',
      })

      expect(stored._status).toEqual({ en: 'draft', fr: 'published' })
      expect(stored.breadcrumbs).toMatchObject({
        en: [{ doc: child.id, url: '/draft-child' }],
        fr: [{ doc: child.id, url: '/enfant-publie' }],
      })
    } finally {
      status.hooks = previousHooks
    }
  })

  test('should support custom localized breadcrumb and parent field names', async ({ payload }) => {
    const parent = await payload.create({
      collection: 'categories',
      locale: 'all',
      data: { name: { en: 'Parent', fr: 'Parent-fr' } },
    })
    const child = await payload.create({
      collection: 'categories',
      locale: 'all',
      data: { owner: parent.id, name: { en: 'Child', fr: 'Enfant' } },
    })
    const stored = await payload.findByID({ collection: 'categories', id: child.id, locale: 'all' })

    expect(stored.categorization).toMatchObject({
      en: [
        { doc: parent.id, label: 'Parent' },
        { doc: child.id, label: 'Child', url: '/Parent/Child' },
      ],
      fr: [
        { doc: parent.id, label: 'Parent-fr' },
        { doc: child.id, label: 'Enfant', url: '/Parent-fr/Enfant' },
      ],
    })
  })
})
