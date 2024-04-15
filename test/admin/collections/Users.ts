import type { CollectionConfig } from 'payload/types'

import { usersCollectionSlug } from '../slugs.js'

export const Users: CollectionConfig = {
  slug: usersCollectionSlug,
  admin: {
    useAsTitle: 'email',
    hidden: () => true,
  },
  auth: true,
  fields: [
    {
      name: 'textField',
      type: 'text',
    },
    {
      name: 'sidebarField',
      type: 'text',
      admin: {
        position: 'sidebar',
      },
    },
  ],
}
