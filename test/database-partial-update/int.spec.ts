import { expect } from 'vitest'

import { test } from '../__helpers/int/vitest.js'
import { articlesSlug, usersSlug } from './shared.js'

const resources = [
  { label: 'Documentation', url: 'https://example.com', children: [{ label: 'Child' }] },
]

test.suite('adapter partial array updates', { config: './config.ts', db: 'drizzle' }, () => {
  test('should preserve omitted arrays during a hasMany relationship-only update', async ({
    payload,
  }) => {
    const user = await payload.create({
      overrideAccess: true,
      collection: usersSlug,
      data: { name: 'Watcher' },
    })
    const article = await payload.create({
      overrideAccess: true,
      collection: articlesSlug,
      data: { resources },
    })

    await payload.db.updateOne({
      collection: articlesSlug,
      id: article.id,
      data: { watchers: [user.id] },
      returning: false,
      select: {},
    })

    const stored = await payload.findByID({
      overrideAccess: true,
      collection: articlesSlug,
      id: article.id,
      depth: 0,
    })

    expect(stored.resources).toEqual(article.resources)
    expect(stored.watchers).toEqual([user.id])
  })

  test('should preserve omitted arrays during a scalar-only update', async ({ payload }) => {
    const article = await payload.create({
      overrideAccess: true,
      collection: articlesSlug,
      data: { resources },
    })

    await payload.db.updateOne({
      collection: articlesSlug,
      id: article.id,
      data: { title: 'Updated' },
    })

    const stored = await payload.findByID({
      overrideAccess: true,
      collection: articlesSlug,
      id: article.id,
    })

    expect(stored.resources).toEqual(article.resources)
    expect(stored.title).toBe('Updated')
  })

  test('should replace explicitly supplied arrays', async ({ payload }) => {
    const article = await payload.create({
      overrideAccess: true,
      collection: articlesSlug,
      data: { resources },
    })

    await payload.db.updateOne({
      collection: articlesSlug,
      id: article.id,
      data: { resources: [{ id: article.resources?.[0]?.id, label: 'Replacement' }] },
    })

    const stored = await payload.findByID({
      overrideAccess: true,
      collection: articlesSlug,
      id: article.id,
    })

    expect(stored.resources).toHaveLength(1)
    expect(stored.resources?.[0]?.label).toBe('Replacement')
    expect(stored.resources?.[0]?.children).toEqual([])
  })

  test('should clear an array explicitly supplied as empty', async ({ payload }) => {
    const article = await payload.create({
      overrideAccess: true,
      collection: articlesSlug,
      data: { resources },
    })

    await payload.db.updateOne({
      collection: articlesSlug,
      id: article.id,
      data: { resources: [] },
    })

    const stored = await payload.findByID({
      overrideAccess: true,
      collection: articlesSlug,
      id: article.id,
    })

    expect(stored.resources).toEqual([])
  })

  test('should preserve omitted arrays inside an updated group', async ({ payload }) => {
    const article = await payload.create({
      overrideAccess: true,
      collection: articlesSlug,
      data: { settings: { resources: [{ label: 'Grouped' }] } },
    })

    await payload.db.updateOne({
      collection: articlesSlug,
      id: article.id,
      data: { settings: { title: 'Updated' }, watchers: [] },
    })

    const stored = await payload.findByID({
      overrideAccess: true,
      collection: articlesSlug,
      id: article.id,
    })

    expect(stored.settings?.resources).toEqual(article.settings?.resources)
    expect(stored.settings?.title).toBe('Updated')
  })

  test('should preserve omitted localized arrays', async ({ payload }) => {
    const article = await payload.create({
      overrideAccess: true,
      collection: articlesSlug,
      data: { localizedResources: [{ label: 'English' }] },
    })

    await payload.db.updateOne({ collection: articlesSlug, id: article.id, data: { watchers: [] } })

    const stored = await payload.findByID({
      overrideAccess: true,
      collection: articlesSlug,
      id: article.id,
    })

    expect(stored.localizedResources).toEqual(article.localizedResources)
  })

  test.options(
    'should preserve arrays when an afterChange hook updates watchers in the same transaction',
    { db: (adapter) => adapter === 'postgres' },
    async ({ payload }) => {
      const user = await payload.create({
        overrideAccess: true,
        collection: usersSlug,
        data: { name: 'Watcher' },
      })
      const article = await payload.create({
        overrideAccess: true,
        collection: articlesSlug,
        data: { resources },
        context: { updateWatchers: user.id },
      })
      const stored = await payload.findByID({
        overrideAccess: true,
        collection: articlesSlug,
        id: article.id,
        depth: 0,
      })

      expect(article.resources).toHaveLength(1)
      expect(stored.resources).toEqual(article.resources)
      expect(stored.watchers).toEqual([user.id])
    },
  )

  test('should preserve an array explicitly supplied as undefined', async ({ payload }) => {
    const article = await payload.create({
      overrideAccess: true,
      collection: articlesSlug,
      data: { resources },
    })

    await payload.db.updateOne({
      collection: articlesSlug,
      id: article.id,
      data: { resources: undefined, watchers: [] },
    })

    const stored = await payload.findByID({
      overrideAccess: true,
      collection: articlesSlug,
      id: article.id,
    })

    expect(stored.resources).toEqual(article.resources)
  })

  test('should append array rows with $push', async ({ payload }) => {
    const article = await payload.create({
      overrideAccess: true,
      collection: articlesSlug,
      data: { resources },
    })

    await payload.db.updateOne({
      collection: articlesSlug,
      id: article.id,
      data: { resources: { $push: { id: '67648ed5c72f13be6eacf24e', label: 'Appended' } } },
    })

    const stored = await payload.findByID({
      overrideAccess: true,
      collection: articlesSlug,
      id: article.id,
    })

    expect(stored.resources).toHaveLength(2)
    expect(stored.resources?.[0]).toEqual(article.resources?.[0])
    expect(stored.resources?.[1]?.label).toBe('Appended')
  })

  test('should preserve arrays during a relationship-only updateMany', async ({ payload }) => {
    const article = await payload.create({
      overrideAccess: true,
      collection: articlesSlug,
      data: { resources },
    })

    await payload.db.updateMany({
      collection: articlesSlug,
      where: { id: { equals: article.id } },
      data: { watchers: [] },
      returning: false,
    })

    const stored = await payload.findByID({
      overrideAccess: true,
      collection: articlesSlug,
      id: article.id,
    })

    expect(stored.resources).toEqual(article.resources)
  })
})
