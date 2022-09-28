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
          name: 'name',
          type: 'text'
        }
      ]
    },
  ]
}

export default Customers;
