import type { CollectionConfig } from 'payload'

import { adminField, isAdmin } from '../../access.js'

export const Users: CollectionConfig = {
  slug: 'users',
  access: {
    create: isAdmin,
    delete: isAdmin,
    read: ({ req: { user } }) =>
      user?.role === 'admin' ? true : user ? { id: { equals: user.id } } : false,
    update: ({ req: { user } }) =>
      user?.role === 'admin' ? true : user ? { id: { equals: user.id } } : false,
  },
  admin: { group: 'Admin', useAsTitle: 'email' },
  auth: true,
  fields: [
    {
      name: 'role',
      type: 'select',
      access: { create: adminField, update: adminField },
      defaultValue: 'admin',
      options: ['admin', 'editor', 'viewer'],
      required: true,
    },
  ],
}
