import { CollectionConfig } from 'payload/types';

const Customers: CollectionConfig = {
  slug: 'customers',
  admin: {
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true
    },
    {
      name: 'stripeSubscriptionID',
      type: 'text',
      admin: {
        position: 'sidebar',
        readOnly: true,
      }
    },
  ],
}

export default Customers;
