import type { CollectionConfig } from 'payload'

import { createFolderField } from 'payload'

import { folderItemsSlug, foldersSlug } from '../../slugs.js'

const FolderItems: CollectionConfig = {
  slug: folderItemsSlug,
  admin: {
    useAsTitle: 'title',
    group: 'Hierarchy Collections',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    createFolderField({ relationTo: foldersSlug }),
  ],
  versions: false,
}

export default FolderItems
