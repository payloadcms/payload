import type { CollectionConfig } from 'payload'

import { isSuperAdmin } from '../../access/isSuperAdmin'
import { isSuperAdminOrSelf } from './access/isSuperAdminOrSelf'
import { externalUsersLogin } from './endpoints/externalUsersLogin'
import { ensureUniqueUsername } from './hooks/ensureUniqueUsername'

const Users: CollectionConfig = {
  slug: 'users',
  access: {
    create: isSuperAdmin,
    delete: isSuperAdmin,
    read: (args) => {
      const { req } = args
      if (!req?.user) return false

      if (isSuperAdmin(args)) return true

      return {
        id: {
          equals: req.user.id,
        },
      }
    },
    update: isSuperAdminOrSelf,
  },
  admin: {
    useAsTitle: 'email',
  },
  auth: true,
  endpoints: [externalUsersLogin],
  fields: [
    {
      name: 'roles',
      type: 'select',
      defaultValue: ['user'],
      hasMany: true,
      options: ['super-admin', 'user'],
    },
    {
      name: 'tenants',
      type: 'array',
      access: {
        create: ({ req }) => {
          if (isSuperAdmin({ req })) return true
          return false
        },
        update: ({ req }) => {
          if (isSuperAdmin({ req })) return true
          return false
        },
      },
      fields: [
        {
          name: 'tenant',
          type: 'relationship',
          index: true,
          relationTo: 'tenants',
          saveToJWT: true,
        },
        {
          name: 'roles',
          type: 'select',
          defaultValue: ['viewer'],
          hasMany: true,
          options: ['super-admin', 'viewer'],
        },
      ],
    },
    {
      name: 'username',
      type: 'text',
      hooks: {
        beforeValidate: [ensureUniqueUsername],
      },
      index: true,
    },
  ],
}

export default Users
