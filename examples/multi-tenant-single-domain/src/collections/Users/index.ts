import type { CollectionConfig } from 'payload'

import { createAccess } from './access/create'
import { readAccess } from './access/read'
import { updateAndDeleteAccess } from './access/updateAndDelete'
import { externalUsersLogin } from './endpoints/externalUsersLogin'
import { ensureUniqueUsername } from './hooks/ensureUniqueUsername'
// import { setCookieBasedOnDomain } from './hooks/setCookieBasedOnDomain'

const Users: CollectionConfig = {
  slug: 'users',
  access: {
    create: createAccess,
    delete: updateAndDeleteAccess,
    read: readAccess,
    update: updateAndDeleteAccess,
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
      fields: [
        {
          name: 'tenant',
          type: 'relationship',
          index: true,
          relationTo: 'tenants',
          required: true,
          saveToJWT: true,
        },
        {
          name: 'roles',
          type: 'select',
          defaultValue: ['tenant-viewer'],
          hasMany: true,
          options: ['tenant-admin', 'tenant-viewer'],
          required: true,
        },
      ],
      saveToJWT: true,
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
  // The following hook sets a cookie based on the domain a user logs in from.
  // It checks the domain and matches it to a tenant in the system, then sets
  // a 'payload-tenant' cookie for that tenant.

  // Uncomment this if you want to enable tenant-based cookie handling by domain.
  // hooks: {
  //   afterLogin: [setCookieBasedOnDomain],
  // },
}

export default Users
