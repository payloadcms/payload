import type { CollectionConfig } from 'payload'

export const Users: CollectionConfig = {
  slug: 'users',
  auth: {
    maxLoginAttempts: 2,
  },
  admin: {
    useAsTitle: 'email',
  },
  access: {},
  fields: [
    // Email added by default
    // Add more fields as needed
  ],
  versions: false,
}
