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
    },
    {
      name: '_lastEdited',
      type: 'group',
      fields: [
        {
          name: 'user',
          type: 'relationship',
          relationTo: config.collections
            .filter((collectionConfig) => collectionConfig.auth)
            .map((collectionConfig) => collectionConfig.slug),
          required: true,
        },
        {
          name: 'editedAt',
          type: 'date',
        },
      ],
    },
    {
      name: 'isLocked',
      type: 'checkbox',
      defaultValue: false,
    },
  ],
})
