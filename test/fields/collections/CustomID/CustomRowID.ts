import type { CollectionConfig } from 'payload'

import { customRowIDSlug } from '../../slugs.js'

export const CustomRowID: CollectionConfig = {
  slug: customRowIDSlug,
  admin: {
    defaultColumns: ['title'],
    useAsTitle: 'id',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
    },
    {
      type: 'row',
      fields: [
        {
          name: 'id',
          type: 'text',
        },
      ],
    },
  ],
  labels: {
    plural: 'Custom Row IDs',
    singular: 'Custom Row ID',
  },
}
