import type { CollectionConfig } from 'payload/types'

import { admins } from './access/admins'
import { adminsAndUser } from './access/adminsAndUser'
import { anyone } from './access/anyone'
import { checkRole } from './access/checkRole'
import { loginAfterCreate } from './hooks/loginAfterCreate'
import { protectRoles } from './hooks/protectRoles'
import { access } from 'fs'
import { create } from 'domain'

export const Users: CollectionConfig = {
  slug: 'users',
  auth: {
    tokenExpiration: 28800, // 8 hours
    cookies: {
      sameSite: 'none',
      secure: true,
      domain: process.env.COOKIE_DOMAIN,
    },
  },
  admin: {
    useAsTitle: 'email',
  },
  access: {
    read: adminsAndUser,
    create: anyone,
    update: adminsAndUser,
    delete: admins,
    unlock: admins,
    admin: ({ req: { user } }) => checkRole(['admin'], user),
  },
  hooks: {
    afterChange: [loginAfterCreate],
  },
  fields: [
    {
      name: 'email',
      type: 'email',
      required: true,
      unique: true,
      access: {
        read: adminsAndUser,
        update: adminsAndUser,
      },
    },
    {
      name: 'password',
      type: 'password',
      required: true,
      admin: {
        description: 'Leave blank to keep the current password.',
      },
    },
    {
      name: 'resetPasswordToken',
      type: 'text',
      hidden: true,
    },
    {
      name: 'resetPasswordExpiration',
      type: 'date',
      hidden: true,
    },
    {
      name: 'firstName',
      type: 'text',
    },
    {
      name: 'lastName',
      type: 'text',
    },
    {
      name: 'roles',
      type: 'select',
      hasMany: true,
      saveToJWT: true,
      access: {
        read: admins,
        update: admins,
        create: admins,
      },
      hooks: {
        beforeChange: [protectRoles],
      },
      options: [
        {
          label: 'Admin',
          value: 'admin',
        },
        {
          label: 'User',
          value: 'user',
        },
      ],
    },
  ],
}
