import type { CollectionConfig } from 'payload'

import { foldersSlug } from '../../slugs.js'

export const Folders: CollectionConfig = {
  slug: foldersSlug,
  admin: {
    useAsTitle: 'name',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
  ],
  folders: {
    admin: {
      treeLimit: 2,
    },
    parentFieldName: 'parent',
  },
  versions: false,
}
