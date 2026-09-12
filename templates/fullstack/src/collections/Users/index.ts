import type { CollectionConfig } from 'payload'

import { adminOnly } from '../../access/index.js'

export const Users: CollectionConfig = {
  slug: 'users',
  admin: { useAsTitle: 'email' },
  auth: true,
  access: {
    create: adminOnly,
    delete: adminOnly,
    read: adminOnly,
    update: adminOnly,
  },
  fields: [
    {
      name: 'role',
      type: 'select',
      defaultValue: 'admin',
      options: [{ label: 'Administrator', value: 'admin' }],
      required: true,
    },
  ],
  versions: false,
}
