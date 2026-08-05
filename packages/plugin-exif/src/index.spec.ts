import type { Config } from 'payload'

import { describe, expect, it } from 'vitest'

import { exifPlugin } from './index.js'

const baseConfig = (): Config =>
  ({
    collections: [
      { slug: 'media', fields: [], upload: true },
      { slug: 'posts', fields: [] },
    ],
  }) as unknown as Config

const hasField = (fields: unknown[], name: string): boolean =>
  fields.some(
    (field) =>
      typeof field === 'object' &&
      field !== null &&
      'name' in field &&
      (field as { name: string }).name === name,
  )

describe('exifPlugin', () => {
  it('should add the exif group only to targeted collections', async () => {
    const result = await exifPlugin({ collections: ['media'] })(baseConfig())
    const media = result.collections?.find((c) => c.slug === 'media')
    const posts = result.collections?.find((c) => c.slug === 'posts')

    expect(hasField(media!.fields, 'exif')).toBe(true)
    expect(hasField(posts!.fields, 'exif')).toBe(false)
  })

  it('should register a single beforeChange hook on the targeted collection', async () => {
    const result = await exifPlugin({ collections: ['media'] })(baseConfig())
    const media = result.collections?.find((c) => c.slug === 'media')

    expect(media!.hooks?.beforeChange).toHaveLength(1)
  })

  it('should add fields but no hook when disabled', async () => {
    const result = await exifPlugin({ collections: ['media'], disabled: true })(baseConfig())
    const media = result.collections?.find((c) => c.slug === 'media')

    expect(hasField(media!.fields, 'exif')).toBe(true)
    expect(media!.hooks?.beforeChange ?? []).toHaveLength(0)
  })

  it('should respect a custom field name', async () => {
    const result = await exifPlugin({ collections: ['media'], fieldName: 'metadata' })(baseConfig())
    const media = result.collections?.find((c) => c.slug === 'media')

    expect(hasField(media!.fields, 'metadata')).toBe(true)
  })
})
