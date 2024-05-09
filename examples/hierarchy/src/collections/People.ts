import type { CollectionConfig } from 'payload/types'

export const People: CollectionConfig = {
  slug: 'people',
  admin: {
    useAsTitle: 'name',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'parents',
      type: 'array',
      fields: [
        {
          name: 'parent',
          type: 'relationship',
          relationTo: 'entities',
        },
        {
          name: 'allocation',
          type: 'number',
          max: 100,
          min: 0,
        },
      ],
    },
  ],
}
