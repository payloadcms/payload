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
      relationTo: [
        ...config.collections.map((collectionConfig, index) => {
          if (!collectionConfig?.slug) {
            throw new Error(`Invalid collection config. Each collection must have a valid slug. Please check your Payload Config collections array.`);
          }
          return collectionConfig.slug;
        })
      ]
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
      relationTo: config.collections.map((collectionConfig, index) => {
        if (!collectionConfig?.slug) {
            throw new Error(`Invalid collection config. Each collection must have a valid slug. Please check your Payload Config collections array.`);
        }
        return collectionConfig.auth ? collectionConfig.slug : null;
      }).filter(Boolean),
      required: true,
    },
  ],
  lockDocuments: false,
})
