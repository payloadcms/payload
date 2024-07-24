import type { CollectionConfig } from 'payload'

export const CustomIdTab: CollectionConfig = {
  slug: 'customIdTab',
  admin: {
    defaultColumns: ['id', 'number', 'title'],
    description: 'Description',
    group: 'One',
    listSearchableFields: ['id', 'title', 'description', 'number'],
    useAsTitle: 'title',
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
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
          label: 'Tab 1',
        },
      ],
    },
  ],
  labels: {
    plural: 'Custom Ids Tab',
    singular: 'Custom Id Tab',
  },
}
