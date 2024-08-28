import type { CollectionConfig } from 'payload'

export const NestedFields: CollectionConfig = {
  slug: 'nested-field-tables',
  fields: [
    {
      name: 'array',
      type: 'array',
      localized: true,
      fields: [
        {
          name: 'relation',
          type: 'relationship',
          relationTo: ['localized-posts'],
        },
        {
          name: 'hasManyRelation',
          type: 'relationship',
          hasMany: true,
          relationTo: 'localized-posts',
        },
        {
          name: 'hasManyPolyRelation',
          type: 'relationship',
          hasMany: true,
          relationTo: ['localized-posts'],
        },
        {
          name: 'select',
          type: 'select',
          hasMany: true,
          options: ['one', 'two', 'three'],
        },
        {
          name: 'number',
          type: 'number',
          hasMany: true,
        },
        {
          name: 'text',
          type: 'text',
          hasMany: true,
        },
      ],
    },
  ],
}
