import type { CollectionConfig } from 'payload'

export const DefaultColumns: CollectionConfig = {
  slug: 'default-columns',
  admin: {
    defaultColumns: ['id', 'field1', 'field2', 'defaultColumnField'],
  },
  enableQueryPresets: true,
  fields: [
    {
      name: 'field1',
      type: 'text',
    },
    {
      name: 'field2',
      type: 'text',
    },
    {
      name: 'field3',
      type: 'text',
    },
    {
      name: 'field4',
      type: 'text',
    },
    {
      name: 'field5',
      type: 'text',
    },
    {
      name: 'field6',
      type: 'text',
    },
    {
      name: 'field7',
      type: 'text',
    },
    {
      name: 'defaultColumnField',
      type: 'text',
    },
  ],
}
