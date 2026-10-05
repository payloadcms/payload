/* eslint vitest/no-standalone-expect: ["error", { "additionalTestBlockFunctions": ["test"] }] -- Tests use the shared fixture wrapper. */
import { expect } from 'vitest'

import { test } from '../__helpers/int/vitest.js'
import { draftGlobalSlug, draftPostsSlug, localizedPostsSlug } from './slugs.js'
import { version } from 'node:os'

// Run: pnpm test:int:sqlite --run test/version-selector/local-api-playground.int.spec.ts
// Each test starts with a clean fixture database. Edit the calls and assertions to experiment.
test.suite('Local API playground', { config: './config.ts' }, () => {
  test('should create a draft by default', async ({ payload }) => {
    const post = await payload.create({
      collection: draftPostsSlug,
      data: { title: 'My first draft' },
    })

    const published = await payload.find({ collection: draftPostsSlug })
    const draft = await payload.findByID({
      id: post.id,
      collection: draftPostsSlug,
      version: 'draft',
    })
    const latest = await payload.findByID({
      id: post.id,
      collection: draftPostsSlug,
      version: 'latest',
    })

    // Omitted version reads published content; latest falls back to published if no draft exists.
    expect(published.docs).toHaveLength(0)
    expect(draft).toMatchObject({ _status: 'draft', title: 'My first draft' })
    expect(latest.title).toBe('My first draft')
  })


  test('should publish the saved draft', async ({ payload }) => {
    const post = await payload.create({
      collection: draftPostsSlug,
      data: { _status: 'draft', title: 'Ready to publish' },
    })

    await payload.update({
      id: post.id,
      collection: draftPostsSlug,
      data: { _status: 'published' },
    })

    const published = await payload.findByID({
      id: post.id,
      collection: draftPostsSlug,
      version: 'published',
    })

    expect(published).toMatchObject({ _status: 'published', title: 'Ready to publish' })
    expect(
      (await payload.find({ collection: draftPostsSlug, version: 'draft' })).docs,
    ).toHaveLength(0)
  })

  test('should publish the saved draft', async ({ payload }) => {
    const post = await payload.create({
      collection: draftPostsSlug,
      data: { title: 'Ready to publish' },
      version: 'draft',
    })

    await payload.update({
      id: post.id,
      collection: draftPostsSlug,
      data: { _status: 'published' },
      version: 'draft',
    })

    const published = await payload.findByID({
      id: post.id,
      collection: draftPostsSlug,
      version: 'published',
    })

    expect(published).toMatchObject({ _status: 'published', title: 'Ready to publish' })
    expect(
      (await payload.find({ collection: draftPostsSlug, version: 'draft' })).docs,
    ).toHaveLength(0)
  })


  test('should edit the live copy while preserving a separate pending draft', async ({
    payload,
  }) => {
    const post = await payload.create({
      collection: draftPostsSlug,
      data: { title: 'Live title' },
      version: 'published',
    })

    // Omitted version on an update saves pending work.
    await payload.update({
      id: post.id,
      collection: draftPostsSlug,
      data: { title: 'Pending redesign' },
    })
    await payload.update({
      id: post.id,
      collection: draftPostsSlug,
      data: { title: 'Corrected live title' },
      version: 'published',
    })

    const published = await payload.findByID({
      id: post.id,
      collection: draftPostsSlug,
      version: 'published',
    })
    const latest = await payload.findByID({
      id: post.id,
      collection: draftPostsSlug,
      version: 'latest',
    })

    expect(published.title).toBe('Corrected live title')
    expect(latest).toMatchObject({ _status: 'draft', title: 'Pending redesign' })
  })

  test('should publish every locale using locale all', async ({ payload }) => {
    const post = await payload.create({
      collection: localizedPostsSlug,
      data: { title: { en: 'Hello', fr: 'Bonjour' } },
      locale: 'all',
      version: 'draft',
    })

    // This replaces the public publishAllLocales argument.
    await payload.update({
      id: post.id,
      collection: localizedPostsSlug,
      data: { _status: 'published' },
      locale: 'all',
      version: 'draft',
    })

    const published = await payload.findByID({
      id: post.id,
      collection: localizedPostsSlug,
      locale: 'all',
      version: 'published',
    })

    expect(published).toMatchObject({
      _status: { en: 'published', fr: 'published' },
      title: { en: 'Hello', fr: 'Bonjour' },
    })
  })

  test('should unpublish every locale using locale all', async ({ payload }) => {
    const post = await payload.create({
      collection: localizedPostsSlug,
      data: { title: { en: 'Hello', fr: 'Bonjour' } },
      locale: 'all',
      version: 'published',
    })

    // This replaces the public unpublishAllLocales argument.
    await payload.update({
      id: post.id,
      collection: localizedPostsSlug,
      data: { _status: 'draft' },
      locale: 'all',
      version: 'published',
    })

    const published = await payload.find({
      collection: localizedPostsSlug,
      locale: 'all',
      version: 'published',
    })
    const draft = await payload.findByID({
      id: post.id,
      collection: localizedPostsSlug,
      locale: 'all',
      version: 'draft',
    })

    expect(published.docs).toHaveLength(0)
    expect(draft).toMatchObject({
      _status: { en: 'draft', fr: 'draft' },
      title: { en: 'Hello', fr: 'Bonjour' },
    })
  })

  test('should save a global draft without changing its published content', async ({ payload }) => {
    // A global's first save uses updateGlobal; _status publishes it before a live copy exists.
    await payload.updateGlobal({
      slug: draftGlobalSlug,
      data: { _status: 'published', title: 'Live homepage' },
      locale: 'en',
    })
    await payload.updateGlobal({
      slug: draftGlobalSlug,
      data: { title: 'Pending homepage' },
      locale: 'en',
      version: 'draft',
    })

    const published = await payload.findGlobal({
      slug: draftGlobalSlug,
      locale: 'en',
      version: 'published',
    })
    const draft = await payload.findGlobal({
      slug: draftGlobalSlug,
      locale: 'en',
      version: 'draft',
    })

    expect(published.title).toBe('Live homepage')
    expect(draft.title).toBe('Pending homepage')
  })
})
