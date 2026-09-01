import type { CollectionConfig } from 'payload'

import { jwtUsersSlug, restrictedRelationshipsSlug } from '../shared.js'

export const JWTUsers: CollectionConfig = {
  slug: jwtUsersSlug,
  auth: {
    depth: 1,
  },
  fields: [
    {
      name: 'peer',
      type: 'relationship',
      relationTo: restrictedRelationshipsSlug,
    },
  ],
  versions: false,
}
