import type { CollectionConfig } from '../collections/config/types.js'
import type { Config } from '../config/types.js'

import { defaultAccess } from '../auth/defaultAccess.js'

export const lockedDocumentsCollectionSlug = 'payload-locked-documents'

export const getLockedDocumentsCollection = (config: Config): CollectionConfig | null => {
  const lockableCollections = config
    .collections!.filter((collectionConfig) => collectionConfig.lockDocuments !== false)
    .map((collectionConfig) => collectionConfig.slug)

  const lockableGlobals = config.globals
    ? config.globals.filter((globalConfig) => globalConfig.lockDocuments !== false)
    : []

  const authCollections = config
    .collections!.filter((collectionConfig) => collectionConfig.auth)
    .map((collectionConfig) => collectionConfig.slug)

  // If there are no lockable collections AND no lockable globals, don't create the collection
  if (lockableCollections.length === 0 && lockableGlobals.length === 0) {
    return null
  }

  // If there are no auth collections, we can't track who locked the document
  // so we shouldn't create the locked-documents collection
  if (authCollections.length === 0) {
    return null
  }

  const fields: CollectionConfig['fields'] = []

  // Only include the document field if there are lockable collections
  if (lockableCollections.length > 0) {
    fields.push({
      name: 'document',
      type: 'relationship',
      index: true,
      maxDepth: 0,
      relationTo: lockableCollections,
    })
  }

  // Always include globalSlug field for tracking global locks
  fields.push({
    name: 'globalSlug',
    type: 'text',
    index: true,
  })

  // Always include user field
  fields.push({
    name: 'user',
    type: 'relationship',
    maxDepth: 1,
    relationTo: authCollections,
    required: true,
  })

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
    fields,
    lockDocuments: false,
  }
}
