import { expect } from 'vitest'

import { test } from '../__helpers/int/vitest.js'
import { slugDraftsSlug, uniqueSlug } from './shared.js'

test.suite('Branching: inherited unique values', { config: './config.ts' }, () => {
  const branch = 'Halloween Updates'

  for (const field of ['slug', 'localizedSlug', 'metadata.code'] as const) {
    test(`should reject a new document with an inherited unique ${field}`, async ({ payload }) => {
      const data =
        field === 'metadata.code' ? { metadata: { code: 'taken' } } : { [field]: 'taken' }

      await payload.create({ collection: uniqueSlug, data, overrideAccess: true })

      await expect(
        payload.create({ branch, collection: uniqueSlug, data, overrideAccess: true }),
      ).rejects.toMatchObject({
        data: { errors: expect.arrayContaining([expect.objectContaining({ path: field })]) },
      })
    })
  }

  for (const draft of [false, true]) {
    test(`should reject an inherited native slug on create (draft: ${draft})`, async ({
      payload,
    }) => {
      await payload.create({
        collection: slugDraftsSlug,
        data: { title: 'Original', slug: 'campaign-launch' },
        overrideAccess: true,
      })

      await expect(
        payload.create({
          branch,
          collection: slugDraftsSlug,
          data: { title: 'Different document', slug: 'campaign-launch' },
          draft,
          overrideAccess: true,
        }),
      ).rejects.toMatchObject({
        data: {
          errors: [expect.objectContaining({ path: 'slug', message: 'Value must be unique' })],
        },
      })
    })
  }

  test('should reject changing a branch document to an inherited unique value', async ({
    payload,
  }) => {
    await payload.create({ collection: uniqueSlug, data: { slug: 'taken' }, overrideAccess: true })

    const doc = await payload.create({
      branch,
      collection: uniqueSlug,
      data: { slug: 'available' },
      overrideAccess: true,
    })

    await expect(
      payload.update({
        id: doc.id,
        branch,
        collection: uniqueSlug,
        data: { slug: 'taken' },
        overrideAccess: true,
      }),
    ).rejects.toMatchObject({
      data: { errors: expect.arrayContaining([expect.objectContaining({ path: 'slug' })]) },
    })
  })

  test('should preserve unique values when editing the same document on a branch', async ({
    payload,
  }) => {
    const doc = await payload.create({
      collection: slugDraftsSlug,
      data: { title: 'Original', slug: 'campaign-launch', code: 'campaign' },
      overrideAccess: true,
    })

    for (const title of ['First branch edit', 'Second branch edit']) {
      const updated = await payload.update({
        id: doc.id,
        branch,
        collection: slugDraftsSlug,
        data: { title },
        overrideAccess: true,
      })

      expect(updated).toMatchObject({
        id: doc.id,
        title,
        slug: 'campaign-launch',
        code: 'campaign',
      })
    }
  })

  test('should reject an inherited compound unique value without exposing branch fields', async ({
    payload,
  }) => {
    const data = { site: 'website', customSlug: 'campaign' }

    await payload.create({ collection: uniqueSlug, data, overrideAccess: true })

    await expect(
      payload.create({ branch, collection: uniqueSlug, data, overrideAccess: true }),
    ).rejects.toMatchObject({
      data: {
        errors: [
          expect.objectContaining({ path: 'site' }),
          expect.objectContaining({ path: 'customSlug' }),
        ],
      },
    })
  })

  test('should report inherited conflicts during validation', async ({ payload }) => {
    await payload.create({ collection: uniqueSlug, data: { slug: 'taken' }, overrideAccess: true })

    const result = await payload.validate({
      collection: uniqueSlug,
      data: { slug: 'taken' },
      overrideAccess: true,
      req: { branch },
    })

    expect(result).toMatchObject({
      valid: false,
      errors: [expect.objectContaining({ path: 'slug' })],
    })
  })

  test('should allow the same unique value on unrelated branches', async ({ payload }) => {
    for (const branch of ['Halloween Updates', 'Q4 Campaign']) {
      const doc = await payload.create({
        branch,
        collection: uniqueSlug,
        data: { slug: 'branch-only' },
        overrideAccess: true,
      })

      expect(doc.slug).toBe('branch-only')
    }
  })

  test.options(
    'should preserve a stored null unique value when editing the same document',
    { db: 'mongo' },
    async ({ payload }) => {
      const doc = await payload.create({
        collection: uniqueSlug,
        data: { slug: null },
        overrideAccess: true,
      })

      for (const site of ['first branch edit', 'second branch edit']) {
        const updated = await payload.update({
          id: doc.id,
          branch,
          collection: uniqueSlug,
          data: { site, slug: null },
          overrideAccess: true,
        })

        expect(updated).toMatchObject({ id: doc.id, slug: null, site })
      }
    },
  )

  test('should preserve locale-specific uniqueness', async ({ payload }) => {
    await payload.create({
      collection: uniqueSlug,
      data: { localizedSlug: 'taken' },
      locale: 'en',
      overrideAccess: true,
    })

    const doc = await payload.create({
      branch,
      collection: uniqueSlug,
      data: { localizedSlug: 'taken' },
      locale: 'es',
      overrideAccess: true,
    })

    expect(doc.localizedSlug).toBe('taken')
  })
})
