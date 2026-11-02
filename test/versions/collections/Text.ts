import type { CollectionConfig } from 'payload'

import { textCollectionSlug, usersCollectionSlug } from '../slugs.js'

export const TextCollection: CollectionConfig = {
  slug: textCollectionSlug,
  access: {
    read: ({ req: { user } }) => {
      if (!user) {
        return false
      }

      return {
        or: [
          {
            owner: {
              equals: user.id,
            },
          },
          {
            owner: {
              exists: false,
            },
          },
        ],
      }
    },
  },
  admin: {
    useAsTitle: 'text',
  },
  fields: [
    {
      name: 'text',
      type: 'text',
      required: true,
    },
    {
      name: 'owner',
      type: 'relationship',
      relationTo: usersCollectionSlug,
    },
  ],
  versions: false,
}
