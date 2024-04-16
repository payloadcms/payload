import type { CollectionConfig } from 'payload/types'

import { admins } from './access/admins'
import adminsAndUser from './access/adminsAndUser'
import { anyone } from './access/anyone'
import { checkRole } from './access/checkRole'
import { loginAfterCreate } from './hooks/loginAfterCreate'
import { protectRoles } from './hooks/protectRoles'

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
    useAsTitle: 'email',
  },
  auth: {
    cookies: {
      domain: process.env.COOKIE_DOMAIN,
      sameSite: 'None',
      secure: true,
    },
    tokenExpiration: 28800, // 8 hours
  },
  fields: [
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
      saveToJWT: true,
    },
  ],
  hooks: {
    afterChange: [loginAfterCreate],
  },
}
