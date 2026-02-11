import type { CollectionConfig } from 'payload'

export const Products: CollectionConfig = {
  slug: 'products',
  fields: [
    {
      name: 'title',
      type: 'text',
    },
    {
      name: 'description',
      type: 'textarea',
    },
    {
      name: 'price',
      type: 'number',
    },
    {
      name: 'relatedPost',
      type: 'relationship',
      relationTo: 'posts',
    },
  ],
}
