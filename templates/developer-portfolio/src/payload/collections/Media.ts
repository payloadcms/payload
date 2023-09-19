import type { CollectionConfig } from 'payload/types'

import { loggedIn } from '../access/loggedIn'

export const Media: CollectionConfig = {
  slug: 'media',
  access: {
    create: loggedIn,
    read: () => true,
    update: loggedIn,
    delete: loggedIn,
  },
  upload: {
    staticURL: '/media',
    staticDir: 'media',
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
    },
  ],
}
