import { expect } from 'vitest'

import { test } from '../__helpers/int/vitest.js'
import { slugDraftsSlug } from './shared.js'

test.suite('Branching: unique fields in drafts', { config: './config.ts' }, () => {
  for (const field of ['slug', 'code'] as const) {
    test(`should reject another document with the same unique ${field} on a branch`, async ({
      payload,
    }) => {
      await payload.create({
        branch: 'halloween-updates',
        collection: slugDraftsSlug,
        data: { [field]: 'taken', title: 'First document' },
        overrideAccess: true,
      })

      await expect(
        payload.create({
          branch: 'halloween-updates',
          collection: slugDraftsSlug,
          data: { [field]: 'taken', title: 'Second document' },
          overrideAccess: true,
        }),
      ).rejects.toMatchObject({
        data: { errors: expect.arrayContaining([expect.objectContaining({ path: field })]) },
      })
    })
  }

  test('should validate both locales of a branch-only draft with a native slug', async ({
    payload,
  }) => {
    const doc = await payload.create({
      branch: 'halloween-updates',
      collection: slugDraftsSlug,
      data: { slug: 'branch-only-slug', title: 'English title' },
      draft: true,
      locale: 'en',
      overrideAccess: true,
    })

    await payload.update({
      id: doc.id,
      branch: 'halloween-updates',
      collection: slugDraftsSlug,
      data: { title: 'Spanish title' },
      draft: true,
      locale: 'es',
      overrideAccess: true,
    })

    const result = await payload.validate({
      id: doc.id,
      collection: slugDraftsSlug,
      data: { _status: 'published', slug: 'branch-only-slug' },
      draft: true,
      locale: ['en', 'es'],
      overrideAccess: true,
      req: { branch: 'halloween-updates' },
    })

    expect(result).toMatchObject({ errors: [], valid: true })
  })

  test('should publish an existing main document without conflicting with its own slug', async ({
    payload,
  }) => {
    const doc = await payload.create({
      branch: 'main',
      collection: slugDraftsSlug,
      data: { _status: 'published', code: 'main-code', slug: 'main-slug', title: 'Original title' },
      overrideAccess: true,
    })

    const updated = await payload.update({
      id: doc.id,
      branch: 'main',
      collection: slugDraftsSlug,
      data: { _status: 'published', code: 'main-code', slug: 'main-slug', title: 'Updated title' },
      overrideAccess: true,
    })

    expect(updated).toMatchObject({ code: 'main-code', slug: 'main-slug', title: 'Updated title' })
  })

  test('should save a new main draft version without conflicting with its own unique fields', async ({
    payload,
  }) => {
    const doc = await payload.create({
      branch: 'main',
      collection: slugDraftsSlug,
      data: { code: 'main-code', slug: 'main-slug', title: 'Original title' },
      overrideAccess: true,
    })

    const updated = await payload.update({
      id: doc.id,
      branch: 'main',
      collection: slugDraftsSlug,
      data: { title: 'Updated title' },
      autosave: true,
      draft: true,
      overrideAccess: true,
    })

    expect(updated).toMatchObject({ code: 'main-code', slug: 'main-slug', title: 'Updated title' })
  })

  test('should fork a versioned document with a native slug onto a branch', async ({ payload }) => {
    const doc = await payload.create({
      collection: slugDraftsSlug,
      data: { slug: 'shared-slug', title: 'Original title' },
      overrideAccess: true,
    })

    const updated = await payload.update({
      id: doc.id,
      branch: 'halloween-updates',
      collection: slugDraftsSlug,
      data: { title: 'Branch title' },
      draft: true,
      overrideAccess: true,
    })

    expect(updated).toMatchObject({ id: doc.id, slug: 'shared-slug', title: 'Branch title' })
  })
})
