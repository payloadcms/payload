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
        description: 'All subscriptions are managed in Stripe and will be reflected here. Use the link in the sidebar to go directly to this customer in Stripe to begin managing their subscriptions.',
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
