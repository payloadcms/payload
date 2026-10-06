/* eslint vitest/no-standalone-expect: ["error", { "additionalTestBlockFunctions": ["test"] }] -- Tests use the shared fixture wrapper. */
import type { SelectField } from 'payload'

import { expect } from 'vitest'

import { test } from '../__helpers/int/vitest.js'
import { draftGlobalSlug, draftPostsSlug, localizedPostsSlug } from './slugs.js'

test.suite('Field hook publication validation', { config: './config.ts' }, () => {
  test('should reject invalid pending collection content when a field hook publishes it', async ({
    payload,
  }) => {
    const live = await payload.create({
      collection: draftPostsSlug,
      data: { title: 'Live' },
      version: 'published',
    })

    await payload.update({ collection: draftPostsSlug, id: live.id, data: { title: '' } })
    const status = payload.collections[draftPostsSlug].config.fields.find(
      (field) => 'name' in field && field.name === '_status',
    ) as SelectField
    const originalHooks = status.hooks
    let hookCalls = 0

    try {
      status.hooks = {
        ...originalHooks,
        beforeChange: [
          () => {
            hookCalls++
            return 'published'
          },
        ],
      }
      await expect(
        payload.update({ collection: draftPostsSlug, id: live.id, data: {} }),
      ).rejects.toMatchObject({ status: 400 })
      expect((await payload.findByID({ collection: draftPostsSlug, id: live.id })).title).toBe(
        'Live',
      )
      expect(
        (await payload.findByID({ collection: draftPostsSlug, id: live.id, version: 'draft' }))
          .title,
      ).toBe('')
      expect(hookCalls).toBe(1)
    } finally {
      status.hooks = originalHooks
    }
  })

  test('should publish valid pending collection content with one field hook execution', async ({
    payload,
  }) => {
    const live = await payload.create({
      collection: draftPostsSlug,
      data: { title: 'Live' },
      version: 'published',
    })

    await payload.update({ collection: draftPostsSlug, id: live.id, data: { title: 'Pending' } })
    const status = payload.collections[draftPostsSlug].config.fields.find(
      (field) => 'name' in field && field.name === '_status',
    ) as SelectField
    const originalHooks = status.hooks
    let hookCalls = 0

    try {
      status.hooks = {
        ...originalHooks,
        beforeChange: [
          () => {
            hookCalls++
            return 'published'
          },
        ],
      }
      await payload.update({ collection: draftPostsSlug, id: live.id, data: {} })
      expect((await payload.findByID({ collection: draftPostsSlug, id: live.id })).title).toBe(
        'Pending',
      )
      expect(hookCalls).toBe(1)
    } finally {
      status.hooks = originalHooks
    }
  })

  test('should reject invalid pending global content when a field hook publishes it', async ({
    payload,
  }) => {
    await payload.updateGlobal({
      slug: draftGlobalSlug,
      locale: 'en',
      data: { title: 'Live', _status: 'published' },
    })
    await payload.updateGlobal({ slug: draftGlobalSlug, locale: 'en', data: { title: '' } })
    const status = payload.globals.config
      .find((global) => global.slug === draftGlobalSlug)!
      .fields.find((field) => 'name' in field && field.name === '_status') as SelectField
    const originalHooks = status.hooks
    let hookCalls = 0

    try {
      status.hooks = {
        ...originalHooks,
        beforeChange: [
          () => {
            hookCalls++
            return 'published'
          },
        ],
      }
      await expect(
        payload.updateGlobal({ slug: draftGlobalSlug, locale: 'en', data: {} }),
      ).rejects.toMatchObject({ status: 400 })
      expect((await payload.findGlobal({ slug: draftGlobalSlug, locale: 'en' })).title).toBe('Live')
      expect(
        (await payload.findGlobal({ slug: draftGlobalSlug, locale: 'en', version: 'draft' })).title,
      ).toBe('')
      expect(hookCalls).toBe(1)
    } finally {
      status.hooks = originalHooks
    }
  })

  test('should publish valid pending global content with one field hook execution', async ({
    payload,
  }) => {
    await payload.updateGlobal({
      slug: draftGlobalSlug,
      locale: 'en',
      data: { title: 'Live', _status: 'published' },
    })
    await payload.updateGlobal({ slug: draftGlobalSlug, locale: 'en', data: { title: 'Pending' } })
    const status = payload.globals.config
      .find((global) => global.slug === draftGlobalSlug)!
      .fields.find((field) => 'name' in field && field.name === '_status') as SelectField
    const originalHooks = status.hooks
    let hookCalls = 0

    try {
      status.hooks = {
        ...originalHooks,
        beforeChange: [
          () => {
            hookCalls++
            return 'published'
          },
        ],
      }
      await payload.updateGlobal({ slug: draftGlobalSlug, locale: 'en', data: {} })
      expect((await payload.findGlobal({ slug: draftGlobalSlug, locale: 'en' })).title).toBe(
        'Pending',
      )
      expect(hookCalls).toBe(1)
    } finally {
      status.hooks = originalHooks
    }
  })

  test('should validate every locale when collection field hooks publish an all-locale draft', async ({
    payload,
  }) => {
    const title = payload.collections[localizedPostsSlug].config.fields.find(
      (field) => 'name' in field && field.name === 'title',
    )!
    const originalRequired = 'required' in title ? title.required : undefined
    const status = payload.collections[localizedPostsSlug].config.fields.find(
      (field) => 'name' in field && field.name === '_status',
    ) as SelectField
    const originalHooks = status.hooks

    try {
      Object.assign(title, { required: true })
      const live = await payload.create({
        collection: localizedPostsSlug,
        locale: 'all',
        data: { title: { en: 'Live English', fr: 'Live French' } },
        version: 'published',
      })

      await payload.update({
        collection: localizedPostsSlug,
        id: live.id,
        locale: 'fr',
        data: { title: '' },
      })
      status.hooks = { ...originalHooks, beforeChange: [() => 'published'] }
      await expect(
        payload.update({ collection: localizedPostsSlug, id: live.id, locale: 'all', data: {} }),
      ).rejects.toMatchObject({ status: 400 })
      expect(
        (await payload.findByID({ collection: localizedPostsSlug, id: live.id, locale: 'fr' }))
          .title,
      ).toBe('Live French')
    } finally {
      Object.assign(title, { required: originalRequired })
      status.hooks = originalHooks
    }
  })
})
