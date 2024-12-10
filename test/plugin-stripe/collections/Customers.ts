import type { CollectionConfig } from 'payload'

import { customersSlug } from '../shared.js'

export const Customers: CollectionConfig = {
  slug: customersSlug,
  admin: {
    defaultColumns: ['email', 'name'],
    useAsTitle: 'email',
  },
  auth: {
    useAPIKey: true,
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      label: 'Name',
    },
    {
      name: 'subscriptions',
      type: 'array',
      admin: {
        description:
          'All subscriptions are managed in Stripe and will be reflected here. Use the link in the sidebar to go directly to this customer in Stripe to begin managing their subscriptions.',
      },
      fields: [
        {
          name: 'link',
          type: 'ui',
          admin: {
            components: {
              Field: '@payloadcms/plugin-stripe/client#LinkToDoc',
            },
            custom: {
              isTestKey: process.env.PAYLOAD_PUBLIC_IS_STRIPE_TEST_KEY === 'true',
              nameOfIDField: `stripeSubscriptionID`,
              stripeResourceType: 'subscriptions',
            },
          },
          label: 'Link',
        },
        {
          name: 'stripeSubscriptionID',
          type: 'text',
          admin: {
            readOnly: true,
          },
          label: 'Stripe ID',
        },
        {
          name: 'stripeProductID',
          type: 'text',
          admin: {
            readOnly: true,
          },
          label: 'Product ID',
        },
        {
          name: 'product',
          type: 'relationship',
          admin: {
            readOnly: true,
          },
          relationTo: 'products',
        },
        {
          name: 'status',
          type: 'select',
          admin: {
            readOnly: true,
          },
          label: 'Status',
          options: [
            {
              label: 'Active',
              value: 'active',
            },
            {
              label: 'Canceled',
              value: 'canceled',
            },
            {
              label: 'Incomplete',
              value: 'incomplete',
            },
            {
              label: 'Incomplete Expired',
              value: 'incomplete_expired',
            },
            {
              label: 'Past Due',
              value: 'past_due',
            },
            {
              label: 'Trialing',
              value: 'trialing',
            },
            {
              label: 'Unpaid',
              value: 'unpaid',
            },
          ],
        },
      ],
      label: 'Subscriptions',
    },
  ],
  timestamps: true,
}
