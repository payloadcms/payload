import type { CollectionConfig } from 'payload'

import { createFolderField } from 'payload'

import { folderSlug } from '../../shared.js'

export const Media: CollectionConfig = {
  slug: 'media',
  fields: [
    {
      name: 'testAdminThumbnail',
      type: 'text',
    },
    createFolderField({ relationTo: folderSlug }),
  ],
  upload: {
    adminThumbnail: ({ doc }) => {
      if (doc.testAdminThumbnail && typeof doc.testAdminThumbnail === 'string') {
        return doc.testAdminThumbnail
      }
      return null
    },
  },
}
