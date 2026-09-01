import type { CollectionConfig } from 'payload'

import { restrictedJWTUsersSlug } from '../shared.js'

export const RestrictedJWTUsers: CollectionConfig = {
  slug: restrictedJWTUsersSlug,
  access: {
    read: () => false,
  },
  auth: true,
  fields: [
    {
      name: 'privateField',
      type: 'text',
      access: {
        read: () => false,
      },
    },
  ],
  versions: false,
}
