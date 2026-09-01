import type { CollectionConfig } from 'payload'

import { restrictedRelationshipsSlug } from '../shared.js'

export const RestrictedRelationships: CollectionConfig = {
  slug: restrictedRelationshipsSlug,
  access: {
    read: () => ({
      isPublic: {
        equals: true,
      },
    }),
  },
  fields: [
    {
      name: 'isPublic',
      type: 'checkbox',
      defaultValue: true,
    },
    {
      name: 'publicField',
      type: 'text',
    },
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
