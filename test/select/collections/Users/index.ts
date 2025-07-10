import type { CollectionConfig } from 'payload'

export const UsersCollection: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'email',
  },
  auth: true,
  fields: [
    {
      name: 'name',
      type: 'text',
      defaultValue: 'Payload dev',
    },
    {
      name: 'number',
      type: 'number',
      defaultValue: 42,
    },
  ],
}
