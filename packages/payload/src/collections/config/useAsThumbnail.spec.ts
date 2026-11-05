import type { CollectionConfig } from '../../index.js'

import { InvalidConfiguration } from '../../errors/InvalidConfiguration.js'
import { sanitizeCollection } from './sanitize.js'
import { describe, expect, it } from 'vitest'

const createCollection = (admin?: CollectionConfig['admin']): CollectionConfig => ({
  slug: 'posts',
  admin,
  fields: [
    { name: 'cover', relationTo: 'media', type: 'upload' },
    { name: 'title', type: 'text' },
  ],
})

const sanitize = (collection: CollectionConfig) =>
  sanitizeCollection(
    // @ts-expect-error test config intentionally omits the full runtime config
    { collections: [collection, { slug: 'media', upload: true, fields: [] }], globals: [] },
    collection,
  )

describe('validate useAsThumbnail', () => {
  it('should default to the first upload field', () => {
    const sanitized = sanitize(createCollection())

    expect(sanitized.admin.useAsThumbnail).toBe('cover')
  })

  it('should preserve an explicit upload field', () => {
    const sanitized = sanitize(createCollection({ useAsThumbnail: 'cover' }))

    expect(sanitized.admin.useAsThumbnail).toBe('cover')
  })

  it.each([
    ['missing', 'missing'],
    ['nested', 'details.cover'],
    ['non-upload', 'title'],
  ])('should reject %s thumbnail fields', (_case, useAsThumbnail) => {
    expect(() => sanitize(createCollection({ useAsThumbnail }))).toThrow(InvalidConfiguration)
  })
})
