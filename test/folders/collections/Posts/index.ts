import type { CollectionConfig } from 'payload'

import { createFolderField, createTaxonomyField } from 'payload'

import { folderSlug, postSlug, taxonomySlug } from '../../shared.js'

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
    {
      name: 'relatedAutosave',
      type: 'relationship',
      relationTo: 'autosave',
    },
    createFolderField({ folderSlug }),
    createTaxonomyField({ taxonomySlug, hasMany: true }),
  ],
  trash: true,
}
