import { expect } from 'vitest'

import { test } from '../__helpers/int/vitest.js'
import {
  defaultLocale,
  globalWithDraftsSlug,
  publicationAccessSlug,
  spanishLocale,
} from './shared.js'

test.suite('Localized publication access', { config: './config.ts' }, () => {
  test('should preserve inaccessible collection locales when unpublishing with locale all', async ({
    payload,
  }) => {
    const doc = await payload.create({
      collection: publicationAccessSlug as any,
      data: { _status: 'published', title: 'filtered published' },
      locale: 'xx',
      overrideAccess: true,
      publishAllLocales: false,
    })

    const updated = await payload.update({
      id: doc.id,
      collection: publicationAccessSlug as any,
      data: {},
      locale: 'all',
      overrideAccess: true,
      unpublishAllLocales: true,
    })
    expect(updated._status.xx).toBe('published')

    const unpublished = await payload.findByID({
      id: doc.id,
      collection: publicationAccessSlug as any,
      draft: false,
      locale: 'all',
      overrideAccess: true,
    })
    expect(unpublished._status[defaultLocale]).toBe('draft')
    expect(unpublished._status[spanishLocale]).toBe('draft')
    expect(unpublished._status.xx).toBe('published')
  })

  test('should preserve inaccessible global locales when unpublishing with locale all', async ({
    payload,
  }) => {
    await payload.updateGlobal({
      slug: globalWithDraftsSlug,
      data: { _status: 'published', text: 'filtered published' },
      locale: 'xx',
      overrideAccess: true,
      publishAllLocales: false,
    })

    const updated = await payload.updateGlobal({
      slug: globalWithDraftsSlug,
      data: {},
      locale: 'all',
      overrideAccess: true,
      unpublishAllLocales: true,
    })
    expect(updated._status.xx).toBe('published')

    const unpublished = await payload.findGlobal({
      slug: globalWithDraftsSlug,
      draft: false,
      locale: 'all',
      overrideAccess: true,
    })
    expect(unpublished._status[defaultLocale]).toBe('draft')
    expect(unpublished._status[spanishLocale]).toBe('draft')
    expect(unpublished._status.xx).toBe('published')
  })
})
