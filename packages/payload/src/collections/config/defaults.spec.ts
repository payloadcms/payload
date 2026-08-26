import type { CollectionConfig } from './types.js'

import { describe, expect, it } from 'vitest'

import { addDefaultsToCollectionConfig } from './defaults.js'

describe('addDefaultsToCollectionConfig', () => {
  it('should default versions to true when not specified', () => {
    const collection: CollectionConfig = {
      slug: 'posts',
      fields: [],
    }

    const result = addDefaultsToCollectionConfig(collection)

    expect(result.versions).toBe(true)
  })

  it('should preserve explicit versions: false', () => {
    const collection: CollectionConfig = {
      slug: 'users',
      fields: [],
      versions: false,
    }

    const result = addDefaultsToCollectionConfig(collection)

    expect(result.versions).toBe(false)
  })

  it('should preserve explicit versions object config', () => {
    const collection: CollectionConfig = {
      slug: 'posts',
      fields: [],
      versions: { drafts: true, maxPerDoc: 50 },
    }

    const result = addDefaultsToCollectionConfig(collection)

    expect(result.versions).toEqual({ drafts: true, maxPerDoc: 50 })
  })

  it('should preserve explicit versions: true', () => {
    const collection: CollectionConfig = {
      slug: 'posts',
      fields: [],
      versions: true,
    }

    const result = addDefaultsToCollectionConfig(collection)

    expect(result.versions).toBe(true)
  })
})
