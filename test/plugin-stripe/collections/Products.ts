import type { CollectionConfig } from '../../../packages/payload/src/collections/config/types.js'

import { productsSlug } from '../shared.js'

export const Products: CollectionConfig = {
  slug: productsSlug,
  admin: {
    defaultColumns: ['name'],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      label: 'Name',
    },
    {
      name: 'price',
      type: 'group',
      admin: {
        description: 'All pricing information is managed in Stripe and will be reflected here.',
        readOnly: true,
      },
      fields: [
        {
          name: 'stripePriceID',
          type: 'text',
          label: 'Stripe Price ID',
        },
        {
          name: 'stripeJSON',
          type: 'textarea',
          label: 'Stripe JSON',
        },
      ],
      label: 'Price',
    },
  ],
  timestamps: true,
}
