import { describe, expect, it } from 'vitest'

import {
  getCollectionSources,
  type InternalVercelBlobStorageAdapter,
} from './getCollectionSources.js'
import { vercelBlobStorage } from './index.js'

describe('getCollectionSources', () => {
  it('includes collections from adapter instances that share a store', () => {
    const mediaAdapter = vercelBlobStorage({
      collections: { media: true },
      token: 'vercel_blob_rw_shared_abc123',
    }) as InternalVercelBlobStorageAdapter
    const protectedAdapter = vercelBlobStorage({
      collections: { protected: { prefix: 'assets' } },
      token: 'vercel_blob_rw_shared_def456',
      useCompositePrefixes: true,
    }) as InternalVercelBlobStorageAdapter
    const otherStoreAdapter = vercelBlobStorage({
      collections: { archive: true },
      token: 'vercel_blob_rw_other_abc123',
    })

    expect(
      getCollectionSources({
        currentAdapter: mediaAdapter,
        storageAdapters: [mediaAdapter, protectedAdapter, otherStoreAdapter],
      }),
    ).toEqual([
      { collectionPrefix: '', collectionSlug: 'media', useCompositePrefixes: false },
      { collectionPrefix: 'assets', collectionSlug: 'protected', useCompositePrefixes: true },
    ])
  })

  it('includes the current adapter when config storage is unavailable', () => {
    const adapter = vercelBlobStorage({
      collections: { media: true },
      token: 'vercel_blob_rw_shared_abc123',
    }) as InternalVercelBlobStorageAdapter

    expect(getCollectionSources({ currentAdapter: adapter, storageAdapters: undefined })).toEqual([
      { collectionPrefix: '', collectionSlug: 'media', useCompositePrefixes: false },
    ])
  })
})
