import type { CollectionConfig } from 'payload'

import { firstUsersSlug } from '../shared.js'

export const FirstUsers: CollectionConfig = {
  slug: firstUsersSlug,
  auth: true,
  fields: [
    {
      name: 'restrictedField',
      type: 'text',
      access: {
        read: () => false,
      },
    },
  ],
}
