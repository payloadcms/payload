import type { CollectionConfig } from 'payload'

export const Users: CollectionConfig = {
  slug: 'users',
  auth: true,
  admin: {
    useAsTitle: 'email',
  },
  access: {},
  fields: [
    // Email added by default
    // Add more fields as needed
  ],
}
