import type { User } from '@/payload-types'
import type { CollectionConfig } from 'payload'

import { admins } from '@/access/admins'
import { anyone } from '@/access/anyone'
import { adminsAndUser } from '@/access/adminsAndUser'
import { checkRole } from '@/access/checkRole'

import { customerProxy } from './endpoints/customer'
import { createStripeCustomer } from './hooks/createStripeCustomer'
import { ensureFirstUserIsAdmin } from './hooks/ensureFirstUserIsAdmin'

export const Users: CollectionConfig = {
  slug: 'users',
  access: {
    admin: ({ req: { user } }) => checkRole(['admin'], user),
    create: anyone,
    delete: admins,
    read: adminsAndUser,
    update: adminsAndUser,
  },
  admin: {
    defaultColumns: ['name', 'email', 'roles'],
    useAsTitle: 'name',
  },
  auth: {
    forgotPassword: {
      generateEmailHTML: (args) => {
        const req = args?.req
        const token = args?.token
        const user = req?.user

        // Use the token provided to allow your user to reset their password
        const resetPasswordURL = `${process.env.NEXT_PUBLIC_SERVER_URL}/reset-password?token=${token}`
        const email = (user as User).email
        return `
          <!doctype html>
          <html>
            <body>
              <h1>Here is my custom email template!</h1>
              <p>Hello, ${email}!</p>
              <p>Click below to reset your password.</p>
              <p>
                <a href="${resetPasswordURL}">${resetPasswordURL}</a>
              </p>
            </body>
          </html>
        `
      },
    },
    tokenExpiration: 1209600,
  },
  endpoints: [
    {
      handler: customerProxy,
      method: 'get',
      path: '/:teamID/customer',
    },
    {
      handler: customerProxy,
      method: 'patch',
      path: '/:teamID/customer',
    },
  ],
  fields: [
    {
      name: 'name',
      type: 'text',
    },
    {
      name: 'roles',
      type: 'select',
      access: {
        /* create: admins, */
        read: admins,
        update: admins,
      },
      defaultValue: ['customer'],
      hasMany: true,
      hooks: {
        beforeChange: [ensureFirstUserIsAdmin],
      },
      options: [
        {
          label: 'admin',
          value: 'admin',
        },
        {
          label: 'customer',
          value: 'customer',
        },
      ],
    },
    {
      name: 'orders',
      type: 'join',
      collection: 'orders',
      on: 'orderedBy',
      admin: {
        allowCreate: false,
        defaultColumns: ['id', 'createdAt', 'total', 'currency', 'items'],
      },
    },
    {
      name: 'stripeCustomerID',
      type: 'text',
      access: {
        /* create: admins, */
        read: admins,
        update: admins,
      },
      admin: {
        position: 'sidebar',
        readOnly: true,
      },
      label: 'Stripe Customer',
    },
    {
      name: 'cart',
      type: 'group',
      fields: [
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
                },
                {
                  name: 'variantID',
                  type: 'text',
                },
                {
                  name: 'variant',
                  type: 'text',
                },
              ],
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'unitPrice',
                  type: 'number',
                  required: true,
                },
                {
                  name: 'quantity',
                  type: 'number',
                  admin: {
                    step: 1,
                  },
                  required: true,
                  min: 0,
                },
              ],
            },
            {
              name: 'url',
              type: 'text',
            },
          ],
          interfaceName: 'CartItems',
          label: 'Items',
        },
      ],
      label: 'Cart',
    },
    {
      name: 'skipSync',
      type: 'checkbox',
      admin: {
        hidden: true,
        position: 'sidebar',
        readOnly: true,
      },
      label: 'Skip Sync',
    },
  ],
  hooks: {
    beforeChange: [createStripeCustomer],
  },
  timestamps: true,
}
