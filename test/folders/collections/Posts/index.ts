import type { CollectionConfig } from 'payload'

import { createFolderField } from 'payload'

import { folderSlug, postSlug } from '../../shared.js'

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
    {
      name: 'heroImage',
      type: 'upload',
      relationTo: 'media',
    },
    createFolderField({ relationTo: folderSlug }),
  ],
  trash: true,
}
