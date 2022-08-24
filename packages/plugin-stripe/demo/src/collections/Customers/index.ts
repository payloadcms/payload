import { CollectionConfig } from 'payload/types';
import { syncNewCustomer } from './stripe/syncNewCustomer';
import { updateExistingCustomer } from './stripe/updateExistingCustomer';

const Customers: CollectionConfig = {
  slug: 'customers',
  timestamps: true,
  admin: {
    useAsTitle: 'email',
  },
  auth: true,
  hooks: {
    beforeValidate: [
      syncNewCustomer,
    ],
    afterChange: [
      updateExistingCustomer,
    ],
  },
  fields: [
    {
      name: 'firstName',
      label: 'First Name',
      type: 'text',
    },
    {
      name: 'lastName',
      label: 'Last Name',
      type: 'text',
    },
    {
      name: 'stripeCustomerID',
      label: 'Stripe Customer ID',
      type: 'text',
      saveToJWT: true,
      admin: {
        position: 'sidebar',
        readOnly: true,
      },
    },
  ]
}

export default Customers;
