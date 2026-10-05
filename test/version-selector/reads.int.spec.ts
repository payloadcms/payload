/* eslint vitest/no-standalone-expect: ["error", { "additionalTestBlockFunctions": ["test"] }] -- Tests use the shared fixture wrapper. */
import { expect, vi } from 'vitest'

import { test } from '../__helpers/int/vitest.js'
import { draftPostsSlug, localizedPostsSlug } from './slugs.js'

test.suite('Version selector reads', { config: './config.ts' }, () => {
  test('should hide unpublished documents by default', async ({ payload }) => {
    const draft = await payload.create({
      collection: draftPostsSlug,
      data: { title: 'Work' },
      overrideAccess: true,
    })

    expect(
      (await payload.find({ collection: draftPostsSlug, overrideAccess: true })).totalDocs,
    ).toBe(0)
    expect(
      await payload.findByID({
        id: draft.id,
        collection: draftPostsSlug,
        disableErrors: true,
        overrideAccess: true,
      }),
    ).toBeNull()
    expect(
      (
        await payload.findByID({
          id: draft.id,
          collection: draftPostsSlug,
          overrideAccess: true,
          version: 'draft',
        })
      ).title,
    ).toBe('Work')
  })

  test('should select distinct values and counts from the requested copy', async ({ payload }) => {
    const live = await payload.create({
      collection: draftPostsSlug,
      data: { title: 'Live' },
      version: 'published',
    })
    await payload.update({ id: live.id, collection: draftPostsSlug, data: { title: 'Pending' } })
    await payload.create({ collection: draftPostsSlug, data: { title: 'Unpublished' } })

    const published = await payload.findDistinct({ collection: draftPostsSlug, field: 'title' })
    const latest = await payload.findDistinct({
      collection: draftPostsSlug,
      field: 'title',
      limit: 1,
      version: 'latest',
    })
    const draft = await payload.findDistinct({
      collection: draftPostsSlug,
      field: 'title',
      version: 'draft',
    })

    expect(published.values).toEqual([{ title: 'Live' }])
    expect(latest.values).toEqual([{ title: 'Pending' }])
    expect(latest.totalDocs).toBe(2)
    expect(latest.hasNextPage).toBe(true)
    expect(draft.values).toEqual([{ title: 'Pending' }, { title: 'Unpublished' }])
    expect(await payload.count({ collection: draftPostsSlug })).toEqual({ totalDocs: 1 })
    expect(await payload.count({ collection: draftPostsSlug, version: 'latest' })).toEqual({
      totalDocs: 2,
    })
    expect(await payload.count({ collection: draftPostsSlug, version: 'draft' })).toEqual({
      totalDocs: 2,
    })
  })

  test('should select published and draft copies independently', async ({ payload }) => {
    const live = await payload.create({
      collection: draftPostsSlug,
      data: { title: 'Live' },
      overrideAccess: true,
      version: 'published',
    })

    await payload.update({
      id: live.id,
      collection: draftPostsSlug,
      data: { title: 'Work' },
      overrideAccess: true,
    })

    expect(
      (await payload.find({ collection: draftPostsSlug, overrideAccess: true })).docs[0]?.title,
    ).toBe('Live')
    expect(
      (await payload.find({ collection: draftPostsSlug, overrideAccess: true, version: 'draft' }))
        .docs[0]?.title,
    ).toBe('Work')
    expect(
      (await payload.find({ collection: draftPostsSlug, overrideAccess: true, version: 'latest' }))
        .docs[0]?.title,
    ).toBe('Work')
  })

  test('should return no draft after publishing the active draft', async ({ payload }) => {
    const draft = await payload.create({
      collection: draftPostsSlug,
      data: { title: 'Work' },
      overrideAccess: true,
    })

    await payload.update({
      id: draft.id,
      collection: draftPostsSlug,
      data: { _status: 'published' },
      overrideAccess: true,
    })

    expect(
      (await payload.find({ collection: draftPostsSlug, overrideAccess: true, version: 'draft' }))
        .totalDocs,
    ).toBe(0)
    expect(
      (await payload.find({ collection: draftPostsSlug, overrideAccess: true, version: 'latest' }))
        .docs[0]?.title,
    ).toBe('Work')
  })

  test('should keep only the newest snapshot active when writes share a timestamp', async ({
    payload,
  }) => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'))

    try {
      const draft = await payload.create({
        collection: draftPostsSlug,
        data: { title: 'Working title' },
        depth: 0,
      })

      await payload.update({
        id: draft.id,
        collection: draftPostsSlug,
        data: { _status: 'published' },
        depth: 0,
      })

      const active = await payload.findVersions({
        collection: draftPostsSlug,
        where: { and: [{ parent: { equals: draft.id } }, { latest: { equals: true } }] },
      })
      const drafts = await payload.find({ collection: draftPostsSlug, version: 'draft' })
      const latest = await payload.findByID({
        id: draft.id,
        collection: draftPostsSlug,
        version: 'latest',
      })

      expect(active.docs).toHaveLength(1)
      expect(active.docs[0].version._status).toBe('published')
      expect(drafts.totalDocs).toBe(0)
      expect(latest._status).toBe('published')
    } finally {
      vi.useRealTimers()
    }
  })

  test('should resolve latest independently for each locale', async ({ payload }) => {
    const live = await payload.create({
      collection: localizedPostsSlug,
      data: { title: { en: 'Live', fr: 'Publié' } },
      locale: 'all',
      overrideAccess: true,
      version: 'published',
    })

    await payload.update({
      id: live.id,
      collection: localizedPostsSlug,
      data: { title: 'Brouillon' },
      locale: 'fr',
      overrideAccess: true,
    })
    await payload.update({
      id: live.id,
      collection: localizedPostsSlug,
      data: { title: 'Corrected' },
      locale: 'en',
      overrideAccess: true,
      version: 'published',
    })

    const latest = await payload.findByID({
      id: live.id,
      collection: localizedPostsSlug,
      locale: 'all',
      overrideAccess: true,
      version: 'latest',
    })

    expect(latest.title).toEqual({ en: 'Corrected', fr: 'Brouillon' })

    const projected = await payload.findByID({
      id: live.id,
      collection: localizedPostsSlug,
      locale: 'all',
      select: { _status: false },
      version: 'latest',
    })
    const list = await payload.find({
      collection: localizedPostsSlug,
      locale: 'all',
      select: { _status: false },
      version: 'latest',
    })
    const published = await payload.findByID({
      id: live.id,
      collection: localizedPostsSlug,
      locale: 'all',
      select: { _status: false },
    })

    expect(projected.title).toEqual(latest.title)
    expect(projected).not.toHaveProperty('_status')
    expect(list.docs[0].title).toEqual(latest.title)
    expect(list.docs[0]).not.toHaveProperty('_status')
    expect(published.title).toEqual({ en: 'Corrected', fr: 'Publié' })
  })
})
