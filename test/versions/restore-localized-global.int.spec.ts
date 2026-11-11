import { createPayloadRequest, restoreVersionOperationGlobal } from 'payload'
import { expect } from 'vitest'

import { test } from '../__helpers/int/vitest.js'
import { localizedGlobalSlug } from './slugs.js'

test.suite('Restoring localized global drafts', { config: './config.ts' }, () => {
  test('should restore every locale as a draft without changing the published global', async ({
    payload,
  }) => {
    await payload.updateGlobal({
      slug: localizedGlobalSlug,
      overrideAccess: true,
      locale: 'en',
      data: { title: 'original', _status: 'published' },
    })
    await payload.updateGlobal({
      slug: localizedGlobalSlug,
      overrideAccess: true,
      locale: 'es',
      data: { title: 'original es', _status: 'published' },
    })

    const versions = await payload.findGlobalVersions({
      slug: localizedGlobalSlug,
      overrideAccess: true,
      limit: 1,
      sort: '-createdAt',
    })

    await payload.updateGlobal({
      slug: localizedGlobalSlug,
      overrideAccess: true,
      locale: 'en',
      data: { title: 'current', _status: 'published' },
    })
    await restoreVersionOperationGlobal({
      globalConfig: payload.globals.config.find(({ slug }) => slug === localizedGlobalSlug)!,
      id: versions.docs[0].id,
      draft: true,
      overrideAccess: true,
      req: await createPayloadRequest({ payload }),
    })

    const restored = await payload.findGlobal({
      slug: localizedGlobalSlug,
      overrideAccess: true,
      locale: 'all',
      draft: true,
    })
    const published = await payload.findGlobal({
      slug: localizedGlobalSlug,
      overrideAccess: true,
      locale: 'en',
    })

    expect(restored._status).toEqual({ en: 'draft', es: 'draft', de: 'draft' })
    expect(restored.title).toMatchObject({ en: 'original', es: 'original es' })
    expect(published.title).toBe('current')
    expect(published._status).toBe('published')
  })
})
