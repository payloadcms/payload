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
      on: 'customer',
      admin: {
        allowCreate: false,
        defaultColumns: ['id', 'createdAt', 'total', 'currency', 'items'],
      },
    },
    {
      name: 'cart',
      type: 'join',
      collection: 'carts',
      on: 'customer',
      admin: {
        allowCreate: false,
        defaultColumns: ['id', 'createdAt', 'total', 'currency', 'items'],
      },
    },
    {
      name: 'addresses',
      type: 'join',
      collection: 'addresses',
      on: 'customer',
      admin: {
        allowCreate: false,
        defaultColumns: ['id'],
      },
    },
  ],
}
