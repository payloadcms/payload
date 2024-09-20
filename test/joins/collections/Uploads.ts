import type { CollectionConfig } from 'payload'

import { uploadsSlug } from '../shared.js'

export const Uploads: CollectionConfig = {
  slug: uploadsSlug,
  fields: [
    {
      name: 'posts',
      type: 'join',
      collection: 'posts',
      on: 'upload',
    },
  ],
  upload: true,
}
