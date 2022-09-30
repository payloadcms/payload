import { CollectionConfig } from 'payload/types';

const Customers: CollectionConfig = {
  slug: 'customers',
  timestamps: true,
  admin: {
    useAsTitle: 'email',
    defaultColumns: [
      'email',
      'name',
    ]
  },
  auth: true,
  fields: [
    {
      name: 'name',
      label: 'Name',
      type: 'text',
    },
    {
      name: 'subscriptions',
      label: 'Subscriptions',
      type: 'array',
      admin: {
        readOnly: true,
      },
      fields: [
        {
          name: 'stripeID',
          label: 'Stripe ID',
          type: 'text',
        },
        {
          name: 'productID',
          label: 'Product ID',
          type: 'text',
        },
        {
          name: 'product',
          type: 'relationship',
          relationTo: 'products',
        },
      ]
    },
  ]
}

export default Customers;
