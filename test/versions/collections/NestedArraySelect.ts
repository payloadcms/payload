import type { CollectionConfig } from 'payload'

import { nestedArraySelectCollectionSlug } from '../slugs.js'

const NestedArraySelect: CollectionConfig = {
  slug: nestedArraySelectCollectionSlug,
  fields: [
    {
      name: 'outer',
      type: 'array',
      fields: [
        {
          name: 'inner',
          type: 'array',
          fields: [
            {
              name: 'days',
              type: 'select',
              hasMany: true,
              options: ['monday', 'tuesday', 'wednesday'],
            },
          ],
        },
      ],
    },
  ],
  versions: {
    drafts: true,
  },
}

export default NestedArraySelect
