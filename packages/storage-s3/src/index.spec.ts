import type { CollectionConfig, Config } from 'payload'

import { describe, expect, it } from 'vitest'

import { s3Storage } from './index.js'

describe('s3Storage', () => {
  it('should not add Admin providers for many client-upload collections', async () => {
    const uploadCollections = Array.from(
      { length: 50 },
      (_, index): CollectionConfig => ({
        fields: [],
        slug: `upload-${index}`,
        upload: true,
      }),
    )
    const storageCollections = Object.fromEntries(
      uploadCollections.map(({ slug }) => [slug, true] as const),
    )
    const storageAdapter = s3Storage({
      bucket: 'bucket',
      clientUploads: true,
      collections: storageCollections,
      config: {},
    })

    const initializedConfig = await storageAdapter.init({
      collections: uploadCollections,
    } as Config)

    expect(initializedConfig.admin?.components?.providers).toBeUndefined()
  })
})
