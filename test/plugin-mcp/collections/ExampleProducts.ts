import type { CollectionConfig } from 'payload'

export const ExampleProducts: CollectionConfig = {
  slug: 'example-products',
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
  ],
}
