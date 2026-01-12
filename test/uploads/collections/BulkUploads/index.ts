import type { CollectionConfig } from 'payload'

import { bulkUploadsSlug } from '../../shared.js'

export const BulkUploadsCollection: CollectionConfig = {
  slug: bulkUploadsSlug,
  upload: true,
  admin: {
    useAsTitle: 'title',
  },
  fields: [
    {
      type: 'text',
      name: 'title',
      required: true,
    },
    {
      name: 'relationship',
      type: 'relationship',
      relationTo: ['simple-relationship'],
    },
  ],
}
