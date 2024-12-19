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
      type: 'relationship',
      access: {
        /* create: admins, */
        update: admins,
      },
      hasMany: true,
      label: 'Orders',
      relationTo: 'orders',
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
                  name: 'variant',
                  type: 'text',
                },
              ],
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'stripeProductID',
                  type: 'text',
                  label: 'Stripe Product ID',
                },
                {
                  name: 'quantity',
                  type: 'number',
                  admin: {
                    step: 1,
                  },
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
        // If you wanted to maintain a 'created on'
        // or 'last modified' date for the cart
        // you could do so here:
        // {
        //   name: 'createdOn',
        //   label: 'Created On',
        //   type: 'date',
        //   admin: {
        //     readOnly: true
        //   }
        // },
        // {
        //   name: 'lastModified',
        //   label: 'Last Modified',
        //   type: 'date',
        //   admin: {
        //     readOnly: true
        //   }
        // },
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
