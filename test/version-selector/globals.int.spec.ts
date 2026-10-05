/* eslint vitest/no-standalone-expect: ["error", { "additionalTestBlockFunctions": ["test"] }] -- Tests use the shared fixture wrapper. */
import { expect } from 'vitest'

import { test } from '../__helpers/int/vitest.js'
import { draftPostsSlug, draftGlobalSlug as slug } from './slugs.js'

test.suite('Global version selectors', { config: './config.ts' }, () => {
  test('should not populate a published-only relationship during a draft-only global read', async ({
    payload,
  }) => {
    const child = await payload.create({
      collection: draftPostsSlug,
      data: { title: 'Published child' },
      version: 'published',
    })

    await payload.updateGlobal({
      slug,
      data: { related: child.id, title: 'Pending global' },
      version: 'draft',
    })
    const draft = await payload.findGlobal({ slug, depth: 1, version: 'draft' })
    const latest = await payload.findGlobal({ slug, depth: 1, version: 'latest' })

    expect(draft.related).toBe(child.id)
    expect(latest.related).toMatchObject({ id: child.id, title: 'Published child' })
  })

  test('should populate the selected published or pending child of a global', async ({
    payload,
  }) => {
    const child = await payload.create({
      collection: draftPostsSlug,
      data: { title: 'Published child' },
      version: 'published',
    })

    await payload.update({
      id: child.id,
      collection: draftPostsSlug,
      data: { title: 'Pending child' },
      version: 'draft',
    })
    await payload.updateGlobal({
      slug,
      data: { _status: 'published', related: child.id, title: 'Published global' },
      version: 'draft',
    })
    await payload.updateGlobal({ slug, data: { title: 'Pending global' }, version: 'draft' })

    expect(
      (await payload.findGlobal({ slug, depth: 1, version: 'published' })).related,
    ).toMatchObject({ title: 'Published child' })
    expect((await payload.findGlobal({ slug, depth: 1, version: 'latest' })).related).toMatchObject(
      { title: 'Pending child' },
    )
    expect((await payload.findGlobal({ slug, depth: 1, version: 'draft' })).related).toMatchObject({
      title: 'Pending child',
    })
  })

  test('should respect relationship read access when populating global versions', async ({
    payload,
  }) => {
    const child = await payload.create({
      collection: draftPostsSlug,
      data: { title: 'Private child' },
    })

    await payload.updateGlobal({
      slug,
      data: { related: child.id, title: 'Pending global' },
      version: 'draft',
    })
    const access = payload.collections[draftPostsSlug].config.access
    const previousRead = access.read

    access.read = () => false
    try {
      expect((await payload.findGlobal({ slug, depth: 1, version: 'draft' })).related).toBe(
        child.id,
      )
      expect((await payload.findGlobal({ slug, depth: 1, version: 'latest' })).related).toBe(
        child.id,
      )
    } finally {
      access.read = previousRead
    }
  })

  test('should keep denied publication changes in the pending global draft', async ({
    payload,
  }) => {
    await payload.updateGlobal({
      slug,
      data: { _status: 'published', title: 'Published' },
      locale: 'en',
      version: 'draft',
    })
    await payload.updateGlobal({ slug, data: { title: 'Pending' }, locale: 'en', version: 'draft' })

    const statusField = payload.globals.config
      .find((global) => global.slug === slug)!
      .fields.find((field) => 'name' in field && field.name === '_status')!
    const previousAccess = statusField.access

    statusField.access = { ...previousAccess, update: () => false }

    try {
      await payload.updateGlobal({
        slug,
        data: { _status: 'published', title: 'Updated pending' },
        locale: 'en',
        overrideAccess: false,
        version: 'draft',
      })

      const published = await payload.findGlobal({ slug, locale: 'en' })
      const draft = await payload.findGlobal({ slug, locale: 'en', version: 'draft' })

      expect(published).toMatchObject({ _status: 'published', title: 'Published' })
      expect(draft).toMatchObject({ _status: 'draft', title: 'Updated pending' })
    } finally {
      statusField.access = previousAccess
    }
  })

  test('should fork a draft from published content when publication field access is denied', async ({
    payload,
  }) => {
    await payload.updateGlobal({
      slug,
      data: { _status: 'published', title: 'Published' },
      locale: 'en',
      version: 'draft',
    })

    const statusField = payload.globals.config
      .find((global) => global.slug === slug)!
      .fields.find((field) => 'name' in field && field.name === '_status')!
    const previousAccess = statusField.access

    statusField.access = { ...previousAccess, update: () => false }

    try {
      await payload.updateGlobal({
        slug,
        data: { _status: 'published', title: 'New pending' },
        locale: 'en',
        overrideAccess: false,
        version: 'draft',
      })

      const published = await payload.findGlobal({ slug, locale: 'en' })
      const draft = await payload.findGlobal({ slug, locale: 'en', version: 'draft' })

      expect(published).toMatchObject({ _status: 'published', title: 'Published' })
      expect(draft).toMatchObject({ _status: 'draft', title: 'New pending' })
    } finally {
      statusField.access = previousAccess
    }
  })

  test('should reject a denied pending draft even when the published copy satisfies update access', async ({
    payload,
  }) => {
    await payload.updateGlobal({
      slug,
      data: { _status: 'published', title: 'Allowed' },
      locale: 'en',
      version: 'draft',
    })
    await payload.updateGlobal({
      slug,
      data: { title: 'Restricted pending' },
      locale: 'en',
      version: 'draft',
    })

    await expect(
      payload.updateGlobal({
        slug,
        context: { versionUpdateTitle: 'Allowed' },
        data: { title: 'Replacement' },
        locale: 'en',
        overrideAccess: false,
        version: 'draft',
      }),
    ).rejects.toMatchObject({ status: 403 })
    expect((await payload.findGlobal({ slug, locale: 'en', version: 'draft' })).title).toBe(
      'Restricted pending',
    )
  })

  test('should enforce update constraints on an initial draft stored only in versions', async ({
    payload,
  }) => {
    await payload.updateGlobal({
      slug,
      data: { title: 'Private pending' },
      locale: 'en',
      version: 'draft',
    })

    await expect(
      payload.updateGlobal({
        slug,
        context: { versionUpdateTitle: 'Different title' },
        data: { title: 'Unauthorized replacement' },
        locale: 'en',
        overrideAccess: false,
        version: 'draft',
      }),
    ).rejects.toMatchObject({ status: 403 })

    expect((await payload.findGlobal({ slug, locale: 'en', version: 'draft' })).title).toBe(
      'Private pending',
    )
  })

  test('should keep an initial draft out of published reads', async ({ payload }) => {
    await payload.updateGlobal({ slug, data: { title: 'Draft' }, version: 'draft' })

    const draft = await payload.findGlobal({ slug, version: 'draft' })
    const published = await payload.findGlobal({ slug })

    expect(draft.title).toBe('Draft')
    expect(published.title).toBeUndefined()
  })

  test('should edit the published global and preserve its pending draft when the selector is omitted', async ({
    payload,
  }) => {
    await payload.updateGlobal({
      slug,
      data: { _status: 'published', title: 'Published' },
      version: 'draft',
    })
    await payload.updateGlobal({ slug, data: { title: 'Pending' }, version: 'draft' })
    await payload.updateGlobal({ slug, data: { title: 'Live edit' } })

    const published = await payload.findGlobal({ slug })
    const draft = await payload.findGlobal({ slug, version: 'draft' })

    expect(published.title).toBe('Live edit')
    expect(draft.title).toBe('Pending')
  })

  test('should reject an omitted selector update for a global that has never been published', async ({
    payload,
  }) => {
    await payload.updateGlobal({ slug, data: { title: 'Draft' }, version: 'draft' })

    await expect(payload.updateGlobal({ slug, data: { title: 'Live edit' } })).rejects.toThrow()
  })

  test('should publish the pending draft with the draft selector', async ({ payload }) => {
    await payload.updateGlobal({
      slug,
      data: { _status: 'published', title: 'Published' },
      version: 'draft',
    })
    await payload.updateGlobal({ slug, data: { title: 'Pending' }, version: 'draft' })
    await payload.updateGlobal({ slug, data: { _status: 'published' }, version: 'draft' })

    const published = await payload.findGlobal({ slug })
    const draft = await payload.findGlobal({ slug, disableErrors: true, version: 'draft' })

    expect(published.title).toBe('Pending')
    expect(draft).toBeNull()
  })

  test('should retain a pending draft when editing the published version', async ({ payload }) => {
    await payload.updateGlobal({
      slug,
      data: { _status: 'published', title: 'Published' },
      version: 'draft',
    })
    await payload.updateGlobal({ slug, data: { title: 'Pending' }, version: 'draft' })
    await payload.updateGlobal({ slug, data: { title: 'Live edit' }, version: 'published' })

    const published = await payload.findGlobal({ slug })
    const draft = await payload.findGlobal({ slug, version: 'draft' })
    const latest = await payload.findGlobal({ slug, version: 'latest' })

    expect(published.title).toBe('Live edit')
    expect(draft.title).toBe('Pending')
    expect(latest.title).toBe('Pending')
  })

  test('should edit the published version with latest when no draft exists', async ({
    payload,
  }) => {
    await payload.updateGlobal({
      slug,
      data: { _status: 'published', title: 'Published' },
      version: 'draft',
    })
    await payload.updateGlobal({ slug, data: { title: 'Live edit' }, version: 'latest' })

    const published = await payload.findGlobal({ slug })
    const draft = await payload.findGlobal({ slug, disableErrors: true, version: 'draft' })

    expect(published.title).toBe('Live edit')
    expect(draft).toBeNull()
  })

  test('should reject published updates when there is only a draft', async ({ payload }) => {
    await payload.updateGlobal({ slug, data: { title: 'Draft' }, version: 'draft' })

    await expect(
      payload.updateGlobal({ slug, data: { title: 'Live edit' }, version: 'published' }),
    ).rejects.toMatchObject({ status: 404 })
  })

  test('should unpublish the live version without replacing its pending draft', async ({
    payload,
  }) => {
    await payload.updateGlobal({
      slug,
      data: { _status: 'published', title: 'Published' },
      version: 'draft',
    })
    await payload.updateGlobal({ slug, data: { title: 'Pending' }, version: 'draft' })
    await payload.updateGlobal({ slug, data: { _status: 'draft' }, version: 'published' })

    const published = await payload.findGlobal({ slug })
    const draft = await payload.findGlobal({ slug, version: 'draft' })

    expect(published.title).toBeUndefined()
    expect(draft.title).toBe('Pending')
  })

  test('should publish every locale with locale all', async ({ payload }) => {
    await payload.updateGlobal({
      slug,
      data: { title: 'English draft' },
      locale: 'en',
      version: 'draft',
    })
    await payload.updateGlobal({
      slug,
      data: { title: 'French draft' },
      locale: 'fr',
      version: 'draft',
    })
    await payload.updateGlobal({
      slug,
      data: { _status: 'published' },
      locale: 'all',
      version: 'draft',
    })

    const published = await payload.findGlobal({ slug, locale: 'all' })

    expect(published.title).toEqual({ en: 'English draft', fr: 'French draft' })
    expect(published._status).toEqual({ en: 'published', fr: 'published' })
  })

  test('should retain complete version data when unpublishing a selected global response', async ({
    payload,
  }) => {
    await payload.updateGlobal({
      slug,
      data: {
        _status: 'published',
        summary: 'Shared summary',
        title: { en: 'English', fr: 'French' },
      },
      locale: 'all',
      version: 'draft',
    })

    const response = await payload.updateGlobal({
      slug,
      data: { _status: 'draft' },
      locale: 'en',
      select: { title: true },
      version: 'published',
    })
    const draft = await payload.findGlobal({ slug, locale: 'en', version: 'draft' })
    const latest = await payload.findGlobal({ slug, locale: 'all', version: 'latest' })

    expect(response.title).toBe('English')
    expect(response).not.toHaveProperty('_status')
    expect(response).not.toHaveProperty('summary')
    expect(draft).toMatchObject({ _status: 'draft', summary: 'Shared summary', title: 'English' })
    expect(latest).toMatchObject({
      _status: { en: 'draft', fr: 'published' },
      summary: 'Shared summary',
      title: { en: 'English', fr: 'French' },
    })
  })

  test('should retain other locale data when correcting a selected published global response', async ({
    payload,
  }) => {
    await payload.updateGlobal({
      slug,
      data: {
        _status: 'published',
        summary: 'Shared summary',
        title: { en: 'English', fr: 'French' },
      },
      locale: 'all',
      version: 'draft',
    })
    await payload.updateGlobal({
      slug,
      data: { title: 'French pending' },
      locale: 'fr',
      version: 'draft',
    })

    const response = await payload.updateGlobal({
      slug,
      data: { title: 'English corrected' },
      locale: 'en',
      select: { title: true },
      version: 'published',
    })
    const published = await payload.findGlobal({ slug, locale: 'all' })
    const latest = await payload.findGlobal({ slug, locale: 'all', version: 'latest' })

    expect(response.title).toBe('English corrected')
    expect(response).not.toHaveProperty('summary')
    expect(published).toMatchObject({
      _status: { en: 'published', fr: 'published' },
      summary: 'Shared summary',
      title: { en: 'English corrected', fr: 'French' },
    })
    expect(latest).toMatchObject({
      _status: { en: 'published', fr: 'draft' },
      summary: 'Shared summary',
      title: { en: 'English corrected', fr: 'French pending' },
    })
  })

  test('should retain selected localized fields without selecting status', async ({ payload }) => {
    await payload.updateGlobal({
      slug,
      data: { _status: 'published', title: { en: 'English', fr: 'French' } },
      locale: 'all',
      version: 'draft',
    })

    const published = await payload.findGlobal({ slug, locale: 'all', select: { title: true } })

    expect(published.title).toEqual({ en: 'English', fr: 'French' })
    expect(published).not.toHaveProperty('_status')
  })

  test('should unpublish the latest live version when no draft exists', async ({ payload }) => {
    await payload.updateGlobal({
      slug,
      data: { _status: 'published', title: 'Published' },
      version: 'draft',
    })
    await payload.updateGlobal({ slug, data: { _status: 'draft' }, version: 'latest' })

    const published = await payload.findGlobal({ slug })

    expect(published.title).toBeUndefined()
  })

  test('should retain another locale draft when latest edits the live locale', async ({
    payload,
  }) => {
    await payload.updateGlobal({
      slug,
      data: { _status: 'published', title: { en: 'English', fr: 'French' } },
      locale: 'all',
      version: 'draft',
    })
    await payload.updateGlobal({
      slug,
      data: { title: 'English draft' },
      locale: 'en',
      version: 'draft',
    })
    await payload.updateGlobal({
      slug,
      data: { title: 'French live edit' },
      locale: 'fr',
      version: 'latest',
    })

    const published = await payload.findGlobal({ slug, locale: 'fr' })
    const draft = await payload.findGlobal({ slug, locale: 'en', version: 'draft' })
    const latest = await payload.findGlobal({ slug, locale: 'all', version: 'latest' })

    expect(published.title).toBe('French live edit')
    expect(draft.title).toBe('English draft')
    expect(latest.title).toEqual({ en: 'English draft', fr: 'French live edit' })
  })

  test('should edit published data with latest and locale all when no draft exists', async ({
    payload,
  }) => {
    await payload.updateGlobal({
      slug,
      data: { _status: 'published', title: { en: 'English', fr: 'French' } },
      locale: 'all',
      version: 'draft',
    })
    await payload.updateGlobal({
      slug,
      data: { summary: 'Live edit' },
      locale: 'all',
      version: 'latest',
    })

    const published = await payload.findGlobal({ slug, locale: 'all' })
    const draft = await payload.findGlobal({
      slug,
      disableErrors: true,
      locale: 'all',
      version: 'draft',
    })

    expect(published.summary).toBe('Live edit')
    expect(draft).toBeNull()
  })
})
