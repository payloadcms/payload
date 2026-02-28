import type { CollectionConfig } from 'payload'

import { createFolderField } from 'payload'

import { postSlug } from '../../shared.js'

export const Posts: CollectionConfig = {
  slug: postSlug,
  admin: {
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
    },
    createFolderField({ relationTo: 'folders' }),
  ],
}
