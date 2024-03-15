import type { CollectionConfig } from 'payload/types'

import { admins } from '../../access/admins'
import { adminsOrLoggedIn } from '../../access/adminsOrLoggedIn'
import { adminsOrOrderedBy } from './access/adminsOrOrderedBy'
import { clearUserCart } from './hooks/clearUserCart'
import { populateOrderedBy } from './hooks/populateOrderedBy'
import { updateUserPurchases } from './hooks/updateUserPurchases'
import { LinkToPaymentIntent } from './ui/LinkToPaymentIntent'

export const Orders: CollectionConfig = {
  slug: 'orders',
  access: {
    create: adminsOrLoggedIn,
    delete: admins,
    read: adminsOrOrderedBy,
    update: admins,
  },
  admin: {
    defaultColumns: ['createdAt', 'orderedBy'],
    preview: (doc) => `${process.env.PAYLOAD_PUBLIC_SERVER_URL}/orders/${doc.id}`,
    useAsTitle: 'createdAt',
  },
  fields: [
    {
      name: 'orderedBy',
      type: 'relationship',
      hooks: {
        beforeChange: [populateOrderedBy],
      },
      relationTo: 'users',
    },
    {
      name: 'stripePaymentIntentID',
      type: 'text',
      admin: {
        components: {
          Field: LinkToPaymentIntent,
        },
        position: 'sidebar',
      },
      label: 'Stripe Payment Intent ID',
    },
    {
      name: 'total',
      type: 'number',
      min: 0,
      required: true,
    },
    {
      name: 'items',
      type: 'array',
      fields: [
        {
          name: 'product',
          type: 'relationship',
          relationTo: 'products',
          required: true,
        },
        {
          name: 'price',
          type: 'number',
          min: 0,
        },
        {
          name: 'quantity',
          type: 'number',
          min: 0,
        },
      ],
    },
  ],
  hooks: {
    afterChange: [updateUserPurchases, clearUserCart],
  },
}
