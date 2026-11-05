import type { StorageAdapter } from 'payload'

import type { VercelBlobCollectionSource } from './authorizeFileOverwrite.js'

type VercelBlobStorageMetadata = {
  collections: Record<string, { prefix?: string } | true | undefined>
  enabled: boolean
  storeId?: string
  useCompositePrefixes: boolean
}

export const vercelBlobStorageMetadata = Symbol('vercelBlobStorageMetadata')

export type InternalVercelBlobStorageAdapter = {
  [vercelBlobStorageMetadata]: VercelBlobStorageMetadata
} & StorageAdapter

const isInternalVercelBlobStorageAdapter = (
  adapter: StorageAdapter,
): adapter is InternalVercelBlobStorageAdapter => vercelBlobStorageMetadata in adapter

export const getCollectionSources = ({
  currentAdapter,
  storageAdapters = [],
}: {
  currentAdapter: InternalVercelBlobStorageAdapter
  storageAdapters?: StorageAdapter[]
}): VercelBlobCollectionSource[] => {
  const currentMetadata = currentAdapter[vercelBlobStorageMetadata]
  const adapters = new Set([currentAdapter, ...storageAdapters])

  return [...adapters].flatMap((adapter) => {
    if (!isInternalVercelBlobStorageAdapter(adapter)) {
      return []
    }

    const metadata = adapter[vercelBlobStorageMetadata]
    if (!metadata.enabled || metadata.storeId !== currentMetadata.storeId) {
      return []
    }

    return Object.entries(metadata.collections).map(([collectionSlug, options]) => ({
      collectionPrefix: options === true ? '' : options?.prefix || '',
      collectionSlug,
      useCompositePrefixes: metadata.useCompositePrefixes,
    }))
  })
}
