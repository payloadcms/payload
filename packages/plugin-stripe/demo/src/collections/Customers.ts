import { CollectionConfig } from 'payload/types';

const Customers: CollectionConfig = {
  slug: 'customers',
  admin: {
    useAsTitle: 'title',
  },
  // hooks: {
  //   afterChange: [] // automatically populate 'stripeCustomerID' field on create
  // },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true
    },
    {
      name: 'stripeCustomerID',
      type: 'text',
      // hooks: {
      //   afterChange: [] // for a two-way sync, send to stripe using the exposed '/stripe/rest' endpoint
      // },
      admin: {
        position: 'sidebar',
        readOnly: true,
      }
    },
  ],
}

export default Customers;
