import type { CollectionConfig } from '../collections/config/types.js'
import type { Config } from '../config/types.js'

export const getLockedDocumentsCollection = (config: Config): CollectionConfig => ({
  slug: 'payload-locked-documents',
  admin: {
    hidden: true,
  },
  fields: [
    {
      name: 'document',
      type: 'relationship',
      index: true,
      maxDepth: 0,
      relationTo: [...config.collections.map((collectionConfig) => collectionConfig.slug)],
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
      relationTo: config.collections
        .filter((collectionConfig) => collectionConfig.auth)
        .map((collectionConfig) => collectionConfig.slug),
      required: true,
    },
  ],
  lockDocuments: false,
})
