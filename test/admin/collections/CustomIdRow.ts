import type { CollectionConfig } from '../../../packages/payload/src/collections/config/types.js'

export const CustomIdRow: CollectionConfig = {
  slug: 'customIdRow',
  labels: {
    singular: 'Custom Id Row',
    plural: 'Custom Ids Row',
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
      type: 'row',
      fields: [
        {
          name: 'title',
          type: 'text',
        },
        {
          name: 'id',
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
}
