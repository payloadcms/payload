import { CollectionConfig } from 'payload/types';
import { createNewStripeCustomer } from '../hooks/createNewStripeCustomer';
import { deleteStripeCustomer } from '../hooks/deleteStripeCustomer';
import { syncExistingStripeCustomer } from '../hooks/syncExistingStripeCustomer';

const Customers: CollectionConfig = {
  slug: 'customers',
  timestamps: true,
  admin: {
    useAsTitle: 'email',
    defaultColumns: [
      'email',
      'name',
      'stripeCustomerID',
    ]
  },
  auth: true,
  hooks: {
    beforeValidate: [
      createNewStripeCustomer,
    ],
    afterChange: [
      syncExistingStripeCustomer,
    ],
    afterDelete: [
      deleteStripeCustomer
    ]
  },
  fields: [
    {
      name: 'name',
      label: 'Name',
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
    {
      name: 'isSyncedToStripe',
      label: 'Synced To Sync',
      type: 'checkbox',
      admin: {
        position: 'sidebar',
        readOnly: true,
      },
    }
  ]
}

export default Customers;
