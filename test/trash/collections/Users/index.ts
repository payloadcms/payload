import type { CollectionConfig } from 'payload'

export const usersSlug = 'users'

export const Users: CollectionConfig = {
  slug: usersSlug,
  admin: {
    useAsTitle: 'name',
  },
  trash: true,
  auth: true,
  fields: [
    {
      name: 'name',
      type: 'text',
    },
    {
      name: 'roles',
      type: 'select',
      hasMany: true,
      options: [
        { label: 'User', value: 'is_user' },
        { label: 'Admin', value: 'is_admin' },
      ],
    },
  ],
}
