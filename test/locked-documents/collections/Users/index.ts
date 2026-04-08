import type { CollectionConfig } from 'payload'

import { usersSlug } from '../../slugs.js'

export const Users: CollectionConfig = {
  slug: usersSlug,
  admin: {
    useAsTitle: 'name',
  },
  auth: true,
  access: {
    read: ({ req: { user }, id }) => {
      // Allow access if the user has the 'is_admin' role or if they are reading their own record
      return Boolean(user?.roles?.includes('is_admin') || user?.id === id)
    },
  },
  fields: [
    {
      name: 'name',
      type: 'text',
    },
    {
      name: 'roles',
      type: 'select',
      hasMany: true,
      // required: true,
      options: [
        { label: 'User', value: 'is_user' },
        { label: 'Admin', value: 'is_admin' },
      ],
    },
  ],
}
