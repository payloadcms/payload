import type { CollectionConfig } from '../../../packages/payload/src/collections/config/types'

import { customIdCollectionSlug } from '../slugs'

export const CustomId: CollectionConfig = {
  slug: customIdCollectionSlug,
  labels: {
    singular: 'Custom Id',
    plural: 'Custom Ids',
  },
  admin: {
    description: 'Description',
    listSearchableFields: ['id', 'title', 'description', 'number'],
    group: 'One',
    useAsTitle: 'title',
    defaultColumns: ['id', 'number', 'title'],
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Tab 1',
          fields: [
            {
              name: 'id',
              type: 'text',
            },
            {
              name: 'title',
              type: 'text',
            },
            {
              name: 'description',
              type: 'text',
            },
            {
              name: 'number',
              type: 'number',
            },
          ],
        },
      ],
    },
  ],
}
