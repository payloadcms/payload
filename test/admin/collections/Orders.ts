import type { CollectionConfig } from 'payload'

export const Orders: CollectionConfig = {
  slug: 'orders',

  fields: [
    {
      name: 'relationship',
      type: 'relationship',
      admin: {
        position: 'sidebar',
      },
      relationTo: 'posts',
    },
    {
      name: 'users',
      type: 'relationship',
      admin: {
        position: 'sidebar',
      },
      relationTo: 'users',
    },
  ],
  versions: {
    drafts: true,
  },
}
