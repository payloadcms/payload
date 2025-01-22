import type { CollectionConfig } from 'payload'

import { usersSlug } from '../../shared.js'

export const Users: CollectionConfig = {
  slug: usersSlug,
  auth: true,
  admin: {
    useAsTitle: 'email',
  },
  access: {
    read: () => true,
  },
  fields: [
    // Email added by default
    // Add more fields as needed
    {
      type: 'select',
      name: 'roles',
      hasMany: true,
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
}
