import type { MongooseAdapter } from '@payloadcms/db-mongodb'

import { ValidationError } from 'payload'
import { expect } from 'vitest'

import { test } from '../__helpers/int/vitest.js'
import { arrayFilteredPostsSlug, localizedPostsSlug, postsSlug } from './shared.js'

test.suite('Compound index existence filters', { config: './config.ts', db: 'mongo' }, () => {
  test('should validate shared key updates against indexes in other locales', async ({
    payload,
  }) => {
    await payload.create({
      collection: localizedPostsSlug,
      data: { tenant: 'first', slug: 'shared' },
      locale: 'de',
      overrideAccess: true,
    })
    const doc = await payload.create({
      collection: localizedPostsSlug,
      data: { tenant: 'second', slug: 'shared' },
      locale: 'de',
      overrideAccess: true,
    })

    expect(
      await payload.validate({
        id: doc.id,
        collection: localizedPostsSlug,
        data: { tenant: 'first' },
        locale: 'en',
        overrideAccess: true,
      }),
    ).toMatchObject({ valid: false })
    await expect(
      payload.update({
        id: doc.id,
        collection: localizedPostsSlug,
        data: { tenant: 'first' },
        locale: 'en',
        overrideAccess: true,
      }),
    ).rejects.toThrow(ValidationError)
  })

  test('should retain distinct locale values and exclude itself during shared key validation', async ({
    payload,
  }) => {
    await payload.create({
      collection: localizedPostsSlug,
      data: { tenant: 'first', slug: 'english' },
      locale: 'de',
      overrideAccess: true,
    })
    const doc = await payload.create({
      collection: localizedPostsSlug,
      data: { tenant: 'second', slug: 'german' },
      locale: 'de',
      overrideAccess: true,
    })

    await payload.update({
      id: doc.id,
      collection: localizedPostsSlug,
      data: { slug: 'english' },
      locale: 'en',
      overrideAccess: true,
    })

    expect(
      await payload.validate({
        id: doc.id,
        collection: localizedPostsSlug,
        data: { tenant: 'first' },
        locale: 'en',
        overrideAccess: true,
      }),
    ).toMatchObject({ valid: true })
    await payload.update({
      id: doc.id,
      collection: localizedPostsSlug,
      data: { tenant: 'first' },
      locale: 'en',
      overrideAccess: true,
    })
    expect(
      await payload.validate({
        id: doc.id,
        collection: localizedPostsSlug,
        locale: 'en',
        overrideAccess: true,
      }),
    ).toMatchObject({ valid: true })
  })

  test('should validate a changed current locale alongside stored locales', async ({ payload }) => {
    await payload.create({
      collection: localizedPostsSlug,
      data: { tenant: 'same', slug: 'english' },
      locale: 'en',
      overrideAccess: true,
    })
    const doc = await payload.create({
      collection: localizedPostsSlug,
      data: { tenant: 'same', slug: 'german' },
      locale: 'de',
      overrideAccess: true,
    })

    expect(
      await payload.validate({
        id: doc.id,
        collection: localizedPostsSlug,
        data: { slug: 'english' },
        locale: 'en',
        overrideAccess: true,
      }),
    ).toMatchObject({ valid: false })
    expect(
      await payload.validate({
        id: doc.id,
        collection: localizedPostsSlug,
        data: { slug: 'new-english' },
        locale: 'en',
        overrideAccess: true,
      }),
    ).toMatchObject({ valid: true })
  })

  test('should validate existence filters when a later array row contains null', async ({
    payload,
  }) => {
    const data = { tenant: 'same', code: 'shared', items: [{}, { gate: null }] }

    await payload.create({ collection: arrayFilteredPostsSlug, data, overrideAccess: true })
    expect(
      await payload.validate({ collection: arrayFilteredPostsSlug, data, overrideAccess: true }),
    ).toMatchObject({ valid: false })
    await expect(
      payload.create({ collection: arrayFilteredPostsSlug, data, overrideAccess: true }),
    ).rejects.toThrow(ValidationError)
  })

  test('should ignore array rows without the filter path and exclude itself', async ({
    payload,
  }) => {
    await payload.create({
      collection: arrayFilteredPostsSlug,
      data: { tenant: 'same', code: 'shared', items: [{}] },
      overrideAccess: true,
    })
    const data = { tenant: 'same', code: 'shared', items: [{ gate: 'present' }] }

    expect(
      await payload.validate({ collection: arrayFilteredPostsSlug, data, overrideAccess: true }),
    ).toMatchObject({ valid: true })

    const doc = await payload.create({
      collection: arrayFilteredPostsSlug,
      data,
      overrideAccess: true,
    })

    expect(
      await payload.validate({
        id: doc.id,
        collection: arrayFilteredPostsSlug,
        overrideAccess: true,
      }),
    ).toMatchObject({ valid: true })
    expect(
      await payload.validate({
        collection: arrayFilteredPostsSlug,
        data: { tenant: 'same', code: 'shared', items: [] },
        overrideAccess: true,
      }),
    ).toMatchObject({ valid: true })
  })

  test('should allow multiple documents missing an indexed field in the same tenant', async ({
    payload,
  }) => {
    await payload.create({ overrideAccess: true, collection: postsSlug, data: { tenant: 'same' } })
    await payload.create({ overrideAccess: true, collection: postsSlug, data: { tenant: 'same' } })

    expect(
      await payload.validate({
        collection: postsSlug,
        data: { tenant: 'same' },
        overrideAccess: true,
      }),
    ).toMatchObject({ valid: true })
  })

  test('should reject duplicate present values but allow the same value in another tenant', async ({
    payload,
  }) => {
    await payload.create({
      overrideAccess: true,
      collection: postsSlug,
      data: { slug: 'shared', tenant: 'first' },
    })
    await payload.create({
      overrideAccess: true,
      collection: postsSlug,
      data: { slug: 'shared', tenant: 'second' },
    })

    await expect(
      payload.create({
        overrideAccess: true,
        collection: postsSlug,
        data: { slug: 'shared', tenant: 'first' },
      }),
    ).rejects.toThrow(ValidationError)
    expect(
      await payload.validate({
        collection: postsSlug,
        data: { slug: 'shared', tenant: 'first' },
        overrideAccess: true,
      }),
    ).toMatchObject({ valid: false })
  })

  test('should include explicit null in the existence filter', async ({ payload }) => {
    await payload.create({
      overrideAccess: true,
      collection: postsSlug,
      data: { slug: null, tenant: 'same' },
    })

    await expect(
      payload.create({
        overrideAccess: true,
        collection: postsSlug,
        data: { slug: null, tenant: 'same' },
      }),
    ).rejects.toThrow(ValidationError)
    expect(
      await payload.validate({
        collection: postsSlug,
        data: { slug: null, tenant: 'same' },
        overrideAccess: true,
      }),
    ).toMatchObject({ valid: false })
  })

  test('should ignore excluded documents when validating a filter-only field', async ({
    payload,
  }) => {
    await payload.create({
      overrideAccess: true,
      collection: postsSlug,
      data: { code: 'shared', tenant: 'same' },
    })
    await payload.create({
      overrideAccess: true,
      collection: postsSlug,
      data: { code: 'shared', tenant: 'same' },
    })

    expect(
      await payload.validate({
        collection: postsSlug,
        data: { code: 'shared', gate: 'present', tenant: 'same' },
        overrideAccess: true,
      }),
    ).toMatchObject({ valid: true })

    await payload.create({
      overrideAccess: true,
      collection: postsSlug,
      data: { code: 'shared', gate: 'present', tenant: 'same' },
    })

    expect(
      await payload.validate({
        collection: postsSlug,
        data: { code: 'shared', tenant: 'same' },
        overrideAccess: true,
      }),
    ).toMatchObject({ valid: true })
    expect(
      await payload.validate({
        collection: postsSlug,
        data: { code: 'shared', gate: 'present', tenant: 'same' },
        overrideAccess: true,
      }),
    ).toMatchObject({ valid: false })
  })

  test('should exclude the document being validated from raw candidates', async ({ payload }) => {
    const doc = await payload.create({
      collection: postsSlug,
      data: { code: 'shared', gate: null, tenant: 'same' },
      overrideAccess: true,
    })

    expect(
      await payload.validate({
        id: doc.id,
        collection: postsSlug,
        overrideAccess: true,
      }),
    ).toMatchObject({ valid: true })
  })

  test('should enforce uniqueness when a filtered document is updated to include the field', async ({
    payload,
  }) => {
    await payload.create({
      overrideAccess: true,
      collection: postsSlug,
      data: { slug: 'shared', tenant: 'same' },
    })
    const excluded = await payload.create({
      overrideAccess: true,
      collection: postsSlug,
      data: { tenant: 'same' },
    })

    await expect(
      payload.update({
        overrideAccess: true,
        id: excluded.id,
        collection: postsSlug,
        data: { slug: 'shared' },
      }),
    ).rejects.toThrow(ValidationError)
  })

  test('should filter nested field paths', async ({ payload }) => {
    await payload.create({ overrideAccess: true, collection: postsSlug, data: { tenant: 'same' } })
    await payload.create({ overrideAccess: true, collection: postsSlug, data: { tenant: 'same' } })
    await payload.create({
      overrideAccess: true,
      collection: postsSlug,
      data: { metadata: { code: 'shared' }, tenant: 'same' },
    })

    await expect(
      payload.create({
        overrideAccess: true,
        collection: postsSlug,
        data: { metadata: { code: 'shared' }, tenant: 'same' },
      }),
    ).rejects.toThrow(ValidationError)
  })

  test('should preserve nested null values when selecting required paths', async ({ payload }) => {
    await payload.create({
      collection: postsSlug,
      data: { metadata: { code: null }, tenant: 'same' },
      overrideAccess: true,
    })

    expect(
      await payload.validate({
        collection: postsSlug,
        data: { metadata: { code: null }, tenant: 'same' },
        overrideAccess: true,
      }),
    ).toMatchObject({ valid: false })
  })

  test('should create partial indexes for each locale in MongoDB', async ({ payload }) => {
    const model = (payload.db as MongooseAdapter).collections[localizedPostsSlug]

    await model.init()
    const indexes = await model.collection.indexes()

    for (const locale of ['en', 'de']) {
      expect(indexes).toContainEqual(
        expect.objectContaining({
          key: { tenant: 1, [`slug.${locale}`]: 1 },
          partialFilterExpression: { [`slug.${locale}`]: { $exists: true } },
          unique: true,
        }),
      )
    }
  })

  test('should validate localized explicit null against the stored locale path', async ({
    payload,
  }) => {
    await payload.create({
      collection: localizedPostsSlug,
      data: { slug: null, tenant: 'same' },
      locale: 'en',
      overrideAccess: true,
    })

    expect(
      await payload.validate({
        collection: localizedPostsSlug,
        data: { slug: null, tenant: 'same' },
        locale: 'en',
        overrideAccess: true,
      }),
    ).toMatchObject({ valid: false })
    expect(
      await payload.validate({
        collection: localizedPostsSlug,
        data: { slug: null, tenant: 'same' },
        locale: 'de',
        overrideAccess: true,
      }),
    ).toMatchObject({ valid: true })
  })

  test('should treat a null filter-only field as present', async ({ payload }) => {
    await payload.create({
      collection: postsSlug,
      data: { code: 'shared', gate: null, tenant: 'same' },
      overrideAccess: true,
    })

    expect(
      await payload.validate({
        collection: postsSlug,
        data: { code: 'shared', gate: 'present', tenant: 'same' },
        overrideAccess: true,
      }),
    ).toMatchObject({ valid: false })
  })

  test('should enforce uniqueness in one locale without requiring the other locale', async ({
    payload,
  }) => {
    await payload.create({
      overrideAccess: true,
      collection: localizedPostsSlug,
      data: { slug: 'shared', tenant: 'same' },
      locale: 'en',
    })
    await payload.create({
      overrideAccess: true,
      collection: localizedPostsSlug,
      data: { slug: 'shared', tenant: 'same' },
      locale: 'de',
    })

    await expect(
      payload.create({
        overrideAccess: true,
        collection: localizedPostsSlug,
        data: { slug: 'shared', tenant: 'same' },
        locale: 'en',
      }),
    ).rejects.toThrow(ValidationError)
  })
})
