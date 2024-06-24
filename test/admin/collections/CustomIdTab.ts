import type { CollectionConfig } from 'payload'

export const CustomIdTab: CollectionConfig = {
  slug: 'customIdTab',
  labels: {
    singular: 'Custom Id Tab',
    plural: 'Custom Ids Tab',
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
    },
  ],
}
