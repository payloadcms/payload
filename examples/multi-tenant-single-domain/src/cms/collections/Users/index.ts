import type { CollectionConfig } from 'payload'
import { isSuperAdmin } from '../../access/isSuperAdmin'
import { isSuperAdminOrSelf } from './access/isSuperAdminOrSelf'
import { ensureUniqueUsername } from './hooks/ensureUniqueUsername'
import { externalUsersLogin } from './endpoints/externalUsersLogin'

const Users: CollectionConfig = {
  slug: 'users',
  auth: true,
  admin: {
    useAsTitle: 'email',
  },
  access: {
    create: isSuperAdmin,
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
    delete: isSuperAdmin,
  },
  fields: [
    {
      name: 'roles',
      type: 'select',
      hasMany: true,
      defaultValue: ['user'],
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
          relationTo: 'tenants',
          index: true,
          saveToJWT: true,
        },
        {
          name: 'roles',
          type: 'select',
          hasMany: true,
          defaultValue: ['viewer'],
          options: ['super-admin', 'viewer'],
        },
      ],
    },
    {
      name: 'username',
      type: 'text',
      index: true,
      hooks: {
        beforeValidate: [ensureUniqueUsername],
      },
    },
  ],
  endpoints: [externalUsersLogin],
}

export default Users
