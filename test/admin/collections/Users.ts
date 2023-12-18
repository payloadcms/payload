import type { CollectionConfig } from '../../../packages/payload/src/collections/config/types'

import { usersCollectionSlug } from '../slugs'

export const Users: CollectionConfig = {
  slug: usersCollectionSlug,
  auth: true,
  admin: {
    useAsTitle: 'email',
  },
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
