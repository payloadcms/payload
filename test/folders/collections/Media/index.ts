import type { CollectionConfig } from 'payload'

import { createFolderField, createTaxonomyField } from 'payload'

import { folderSlug, taxonomySlug } from '../../shared.js'

export const Media: CollectionConfig = {
  slug: 'media',
  fields: [
    {
      name: 'testAdminThumbnail',
      type: 'text',
    },
    createFolderField({ folderSlug }),
    createTaxonomyField({ taxonomySlug, hasMany: true }),
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
