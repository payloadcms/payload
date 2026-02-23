import type { CollectionConfig } from 'payload'

import { createFolderField, createTagField } from 'payload'

import { folderSlug, tagsSlug } from '../../shared.js'

export const Media: CollectionConfig = {
  slug: 'media',
  fields: [
    {
      name: 'testAdminThumbnail',
      type: 'text',
    },
    createFolderField({ relationTo: folderSlug }),
    createTagField({ relationTo: tagsSlug, hasMany: true }),
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
