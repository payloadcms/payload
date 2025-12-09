import type { CollectionConfig } from '../collections/config/types.js'
import type { Config } from '../config/types.js'

import { defaultAccess } from '../auth/defaultAccess.js'

export const lockedDocumentsCollectionSlug = 'payload-locked-documents'

export const getLockedDocumentsCollection = (config: Config): CollectionConfig | null => {
  const lockableCollections = config
    .collections!.filter((collectionConfig) => collectionConfig.lockDocuments !== false)
    .map((collectionConfig) => collectionConfig.slug)

  const authCollections = config
    .collections!.filter((collectionConfig) => collectionConfig.auth)
    .map((collectionConfig) => collectionConfig.slug)

  // If there are no lockable collections, don't create the locked-documents collection
  if (lockableCollections.length === 0) {
    return null
  }

  // If there are no auth collections, we can't track who locked the document
  // so we shouldn't create the locked-documents collection
  if (authCollections.length === 0) {
    return null
  }

  return {
    slug: lockedDocumentsCollectionSlug,
    access: {
      create: defaultAccess,
      delete: defaultAccess,
      read: defaultAccess,
      update: defaultAccess,
    },
    admin: {
      hidden: true,
    },
    fields: [
      {
        name: 'document',
        type: 'relationship',
        index: true,
        maxDepth: 0,
        relationTo: lockableCollections,
      },
      {
        name: 'globalSlug',
        type: 'text',
        index: true,
      },
      {
        name: 'user',
        type: 'relationship',
        maxDepth: 1,
        relationTo: authCollections,
        required: true,
      },
    ],
    lockDocuments: false,
  }
}
