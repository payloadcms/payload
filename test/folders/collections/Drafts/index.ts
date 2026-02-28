import type { CollectionConfig } from 'payload'

import { createFolderField } from 'payload'

import { folderSlug } from '../../shared.js'

export const Drafts: CollectionConfig = {
  slug: 'drafts',
  admin: {
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
    },
    createFolderField({ relationTo: folderSlug }),
  ],
  versions: {
    drafts: true,
  },
}
