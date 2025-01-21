import type { CollectionConfig } from 'payload'

import { admins } from '@/access/admins'
import { adminsOrLoggedIn } from '@/access/adminsOrLoggedIn'
import { adminsOrOrderedByOrPaymentId } from '@/access/adminsOrOrderedByOrPaymentId'
import { clearUserCart } from './hooks/clearUserCart'
import { populateOrderedBy } from './hooks/populateOrderedBy'
import { LinkToPaymentIntent } from './ui/LinkToPaymentIntent'

export const Orders: CollectionConfig = {
  slug: 'orders',
  access: {
    create: adminsOrLoggedIn,
    delete: admins,
    read: adminsOrOrderedByOrPaymentId,
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
        /* components: {
          Field: LinkToPaymentIntent,
        }, */
        position: 'sidebar',
      },
      label: 'Stripe Payment Intent ID',
    },
    {
      type: 'row',
      fields: [
        {
          name: 'total',
          type: 'number',
          min: 0,
          required: true,
        },
        {
          name: 'currency',
          type: 'text',
          required: true,
        },
      ],
    },
    {
      name: 'items',
      type: 'array',
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'product',
              type: 'relationship',
              relationTo: 'products',
              required: true,
            },
            {
              name: 'variant',
              type: 'text',
            },
          ],
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
    afterChange: [clearUserCart],
  },
}
