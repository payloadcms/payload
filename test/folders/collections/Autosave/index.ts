import type { CollectionConfig } from 'payload'

import { createFolderField } from 'payload'

import { folderSlug } from '../../shared.js'

export const Autosave: CollectionConfig = {
  slug: 'autosave',
  admin: {
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
    },
    createFolderField({ fieldName: 'folder', relationTo: folderSlug }),
  ],
  versions: {
    drafts: {
      autosave: true,
    },
  },
}
