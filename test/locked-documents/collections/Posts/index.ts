import type { CollectionConfig } from 'payload'

import { postsSlug } from '../../slugs.js'

export const PostsCollection: CollectionConfig = {
  slug: postsSlug,
  admin: {
    useAsTitle: 'text',
    defaultColumns: ['text', 'createdAt', 'updatedAt', '_status'],
  },
  lockDocuments: {
    duration: 180,
  },
  fields: [
    {
      name: 'text',
      type: 'text',
    },
    {
      name: 'documentLoaded',
      label: 'Document loaded',
      type: 'date',
      admin: {
        date: {
          displayFormat: 'yyyy-MM-dd HH:mm:ss',
        },
        readOnly: true,
        components: {
          Field: '/collections/Posts/fields/DocumentLoaded.tsx#DocumentLoaded',
        },
      },
    },
  ],
  versions: {
    drafts: true,
  },
}
