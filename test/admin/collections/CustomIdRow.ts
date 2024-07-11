import type { CollectionConfig } from 'payload'

export const CustomIdRow: CollectionConfig = {
  slug: 'customIdRow',
  admin: {
    defaultColumns: ['id', 'number', 'title'],
    description: 'Description',
    group: 'One',
    listSearchableFields: ['id', 'title', 'description', 'number'],
    useAsTitle: 'title',
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
  labels: {
    plural: 'Custom Ids Row',
    singular: 'Custom Id Row',
  },
}
