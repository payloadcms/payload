import type { CollectionConfig } from 'payload'

export const Users: CollectionConfig = {
  slug: 'users',
  auth: true,
  admin: {
    useAsTitle: 'email',
  },
  access: {
    admin: ({ req }) => req.user?.email !== 'non-admin@example.com',
    read: () => true,
  },
  fields: [
    {
      name: 'email',
      type: 'email',
      label: 'Custom Email',
    },
  ],
}
