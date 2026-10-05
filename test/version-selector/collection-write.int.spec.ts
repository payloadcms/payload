/* eslint vitest/no-standalone-expect: ["error", { "additionalTestBlockFunctions": ["test"] }] -- Tests use the shared fixture wrapper. */
import type { SelectField } from 'payload'

import { expect } from 'vitest'

import { test } from '../__helpers/int/vitest.js'
import { draftPostsSlug, localizedPostsSlug, plainPostsSlug } from './slugs.js'

test.suite('Collection version selectors', { config: './config.ts' }, () => {
  test('should reject a denied pending draft even when its published copy satisfies update access', async ({
    payload,
  }) => {
    const live = await payload.create({
      collection: localizedPostsSlug,
      data: { title: 'Allowed' },
      locale: 'en',
      version: 'published',
    })
    await payload.update({
      id: live.id,
      collection: localizedPostsSlug,
      data: { title: 'Restricted pending' },
      locale: 'en',
      version: 'draft',
    })

    await expect(
      payload.update({
        id: live.id,
        collection: localizedPostsSlug,
        context: { versionUpdateTitle: 'Allowed' },
        data: { title: 'Replacement' },
        locale: 'en',
        overrideAccess: false,
        version: 'draft',
      }),
    ).rejects.toMatchObject({ status: 403 })
    expect(
      (
        await payload.findByID({
          id: live.id,
          collection: localizedPostsSlug,
          locale: 'en',
          version: 'draft',
        })
      ).title,
    ).toBe('Restricted pending')
  })

  test('should preserve published content when publication field access denies a draft publish', async ({
    payload,
  }) => {
    const live = await payload.create({
      collection: draftPostsSlug,
      data: { title: 'Live' },
      version: 'published',
    })
    await payload.update({
      id: live.id,
      collection: draftPostsSlug,
      data: { title: 'Pending' },
      version: 'draft',
    })

    const statusField = payload.collections[draftPostsSlug].config.fields.find(
      (field) => 'name' in field && field.name === '_status',
    ) as SelectField
    const originalAccess = statusField.access

    try {
      statusField.access = { ...originalAccess, update: () => false }

      await payload.update({
        id: live.id,
        collection: draftPostsSlug,
        data: { _status: 'published', title: 'Edited pending' },
        overrideAccess: false,
        version: 'draft',
      })

      const published = await payload.findByID({ id: live.id, collection: draftPostsSlug })
      const draft = await payload.findByID({
        id: live.id,
        collection: draftPostsSlug,
        version: 'draft',
      })

      expect(published.title).toBe('Live')
      expect(published._status).toBe('published')
      expect(draft.title).toBe('Edited pending')
      expect(draft._status).toBe('draft')
    } finally {
      statusField.access = originalAccess
    }
  })

  test('should create a draft by default', async ({ payload }) => {
    const doc = await payload.create({ collection: draftPostsSlug, data: { title: 'Draft' } })

    expect(doc._status).toBe('draft')
  })

  test('should let the explicit create selector override the submitted status', async ({
    payload,
  }) => {
    const doc = await payload.create({
      collection: draftPostsSlug,
      data: { _status: 'published', title: 'Draft' },
      version: 'draft',
    })

    expect(doc._status).toBe('draft')
  })

  test('should publish a create when the submitted status requests publication', async ({
    payload,
  }) => {
    const doc = await payload.create({
      collection: draftPostsSlug,
      data: { _status: 'published', title: 'Live' },
    })

    expect(doc._status).toBe('published')
  })

  test('should let the published create selector override a submitted draft status', async ({
    payload,
  }) => {
    const doc = await payload.create({
      collection: draftPostsSlug,
      data: { _status: 'draft', title: 'Live' },
      version: 'published',
    })

    expect(doc._status).toBe('published')
  })

  test('should preserve a pending draft when updating the published document', async ({
    payload,
  }) => {
    const doc = await payload.create({
      collection: draftPostsSlug,
      data: { title: 'Live' },
      version: 'published',
    })

    await payload.update({
      id: doc.id,
      collection: draftPostsSlug,
      data: { title: 'Pending' },
      version: 'draft',
    })
    await payload.update({
      id: doc.id,
      collection: draftPostsSlug,
      data: { title: 'Live correction' },
      version: 'published',
    })

    const live = await payload.findByID({
      id: doc.id,
      collection: draftPostsSlug,
      version: 'published',
    })
    const draft = await payload.findByID({
      id: doc.id,
      collection: draftPostsSlug,
      version: 'draft',
    })

    expect(live.title).toBe('Live correction')
    expect(draft.title).toBe('Pending')
  })

  test('should publish the active draft when status requests publication', async ({ payload }) => {
    const doc = await payload.create({ collection: draftPostsSlug, data: { title: 'Pending' } })

    await payload.update({
      id: doc.id,
      collection: draftPostsSlug,
      data: { _status: 'published' },
      version: 'draft',
    })

    const live = await payload.findByID({
      id: doc.id,
      collection: draftPostsSlug,
      version: 'published',
    })

    expect(live.title).toBe('Pending')
    expect(live._status).toBe('published')
  })

  test('should reject a published update for a document that has never been published', async ({
    payload,
  }) => {
    const doc = await payload.create({ collection: draftPostsSlug, data: { title: 'Pending' } })

    await expect(
      payload.update({
        id: doc.id,
        collection: draftPostsSlug,
        data: { title: 'Cannot update live' },
        version: 'published',
      }),
    ).rejects.toThrow()
  })

  test('should update a live document directly with latest when no draft exists', async ({
    payload,
  }) => {
    const doc = await payload.create({
      collection: draftPostsSlug,
      data: { title: 'Live' },
      version: 'published',
    })

    await payload.update({
      id: doc.id,
      collection: draftPostsSlug,
      data: { title: 'New live' },
      version: 'latest',
    })

    const live = await payload.findByID({
      id: doc.id,
      collection: draftPostsSlug,
      version: 'published',
    })

    expect(live.title).toBe('New live')
  })

  test('should reject explicit draft selectors when drafts are disabled', async ({ payload }) => {
    await expect(
      payload.create({
        collection: plainPostsSlug,
        data: { title: 'Plain' },
        version: 'draft',
      }),
    ).rejects.toThrow()
  })

  test('should keep ordinary writes available when drafts are disabled', async ({ payload }) => {
    const doc = await payload.create({ collection: plainPostsSlug, data: { title: 'Original' } })

    const updated = await payload.update({
      id: doc.id,
      collection: plainPostsSlug,
      data: { title: 'Updated' },
      version: 'latest',
    })

    expect(updated.title).toBe('Updated')
  })

  test('should preserve a pending draft when unpublishing the live document', async ({
    payload,
  }) => {
    const doc = await payload.create({
      collection: draftPostsSlug,
      data: { title: 'Live' },
      version: 'published',
    })

    await payload.update({
      id: doc.id,
      collection: draftPostsSlug,
      data: { title: 'Pending' },
      version: 'draft',
    })
    await payload.update({
      id: doc.id,
      collection: draftPostsSlug,
      data: { _status: 'draft' },
      version: 'published',
    })

    const draft = await payload.findByID({
      id: doc.id,
      collection: draftPostsSlug,
      version: 'draft',
    })

    expect(draft.title).toBe('Pending')
    await expect(
      payload.findByID({
        id: doc.id,
        collection: draftPostsSlug,
        version: 'published',
      }),
    ).rejects.toThrow()
  })

  test('should keep a draft unpublished when selecting latest', async ({ payload }) => {
    const doc = await payload.create({ collection: draftPostsSlug, data: { title: 'Draft' } })

    const result = await payload.update({
      id: doc.id,
      collection: draftPostsSlug,
      data: { title: 'Latest draft' },
      version: 'latest',
    })

    expect(result.title).toBe('Latest draft')
    expect(result._status).toBe('draft')
    await expect(
      payload.findByID({
        id: doc.id,
        collection: draftPostsSlug,
        version: 'published',
      }),
    ).rejects.toThrow()
  })

  test('should edit the published document and preserve its pending draft for an omitted update selector', async ({
    payload,
  }) => {
    const doc = await payload.create({
      collection: draftPostsSlug,
      data: { title: 'Live' },
      version: 'published',
    })

    await payload.update({
      id: doc.id,
      collection: draftPostsSlug,
      data: { title: 'Pending' },
      version: 'draft',
    })
    await payload.update({ id: doc.id, collection: draftPostsSlug, data: { title: 'Live edit' } })

    const live = await payload.findByID({ id: doc.id, collection: draftPostsSlug })
    const draft = await payload.findByID({
      id: doc.id,
      collection: draftPostsSlug,
      version: 'draft',
    })

    expect(live.title).toBe('Live edit')
    expect(draft.title).toBe('Pending')
  })

  test('should reject an omitted update selector for a document that has never been published', async ({
    payload,
  }) => {
    const doc = await payload.create({ collection: draftPostsSlug, data: { title: 'Draft' } })

    await expect(
      payload.update({ id: doc.id, collection: draftPostsSlug, data: { title: 'Live edit' } }),
    ).rejects.toThrow()
  })

  test('should fork published content with the draft update selector', async ({ payload }) => {
    const doc = await payload.create({
      collection: draftPostsSlug,
      data: { title: 'Live' },
      version: 'published',
    })

    await payload.update({
      id: doc.id,
      collection: draftPostsSlug,
      data: { title: 'Pending' },
      version: 'draft',
    })

    const live = await payload.findByID({
      id: doc.id,
      collection: draftPostsSlug,
      version: 'published',
    })

    expect(live.title).toBe('Live')
  })

  test('should select each bulk document version independently with latest', async ({
    payload,
  }) => {
    const liveDoc = await payload.create({
      collection: draftPostsSlug,
      data: { title: 'Live' },
      version: 'published',
    })
    const draftDoc = await payload.create({ collection: draftPostsSlug, data: { title: 'Draft' } })

    const result = await payload.update({
      collection: draftPostsSlug,
      data: { title: 'Bulk update' },
      version: 'latest',
      where: { id: { in: [liveDoc.id, draftDoc.id] } },
    })

    expect(result.errors).toEqual([])
    expect(result.docs).toHaveLength(2)

    const live = await payload.findByID({
      id: liveDoc.id,
      collection: draftPostsSlug,
      version: 'published',
    })
    const draft = await payload.findByID({
      id: draftDoc.id,
      collection: draftPostsSlug,
      version: 'draft',
    })

    expect(live.title).toBe('Bulk update')
    expect(draft.title).toBe('Bulk update')
    expect(draft._status).toBe('draft')
  })

  test('should publish only the requested locale', async ({ payload }) => {
    const doc = await payload.create({
      collection: localizedPostsSlug,
      data: { title: { en: 'English', fr: 'French' } },
      locale: 'all',
    })

    await payload.update({
      id: doc.id,
      collection: localizedPostsSlug,
      data: { _status: 'published' },
      locale: 'en',
      version: 'draft',
    })

    const english = await payload.findByID({
      id: doc.id,
      collection: localizedPostsSlug,
      locale: 'en',
      version: 'published',
    })

    expect(english.title).toBe('English')
    await expect(
      payload.findByID({
        id: doc.id,
        collection: localizedPostsSlug,
        locale: 'fr',
        version: 'published',
      }),
    ).rejects.toThrow()
  })

  test('should publish all locales with locale all', async ({ payload }) => {
    const doc = await payload.create({
      collection: localizedPostsSlug,
      data: { title: { en: 'English', fr: 'French' } },
      locale: 'all',
    })

    await payload.update({
      id: doc.id,
      collection: localizedPostsSlug,
      data: { _status: 'published' },
      locale: 'all',
      version: 'draft',
    })

    const published = await payload.findByID({
      id: doc.id,
      collection: localizedPostsSlug,
      locale: 'all',
      version: 'published',
    })

    expect(published.title).toEqual({ en: 'English', fr: 'French' })
    expect(published._status).toEqual({ en: 'published', fr: 'published' })
  })

  test('should unpublish live content with latest when no active draft exists', async ({
    payload,
  }) => {
    const doc = await payload.create({
      collection: draftPostsSlug,
      data: { title: 'Live' },
      version: 'published',
    })

    await payload.update({
      id: doc.id,
      collection: draftPostsSlug,
      data: { _status: 'draft' },
      version: 'latest',
    })

    await expect(
      payload.findByID({
        id: doc.id,
        collection: draftPostsSlug,
        version: 'published',
      }),
    ).rejects.toThrow()
  })

  test('should preserve pending drafts during bulk published corrections', async ({ payload }) => {
    const doc = await payload.create({
      collection: draftPostsSlug,
      data: { title: 'Live' },
      version: 'published',
    })

    await payload.update({
      id: doc.id,
      collection: draftPostsSlug,
      data: { title: 'Pending' },
      version: 'draft',
    })

    const result = await payload.update({
      collection: draftPostsSlug,
      data: { title: 'Corrected live' },
      version: 'published',
      where: { id: { equals: doc.id } },
    })
    const live = await payload.findByID({
      id: doc.id,
      collection: draftPostsSlug,
      version: 'published',
    })
    const draft = await payload.findByID({
      id: doc.id,
      collection: draftPostsSlug,
      version: 'draft',
    })

    expect(result.errors).toEqual([])
    expect(live.title).toBe('Corrected live')
    expect(draft.title).toBe('Pending')
  })
})
