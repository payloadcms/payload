import type { CollectionConfig } from 'payload'

import { createFolderField, createTagField } from 'payload'

import { folderSlug, postSlug, tagsSlug } from '../../shared.js'

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
    createFolderField({ relationTo: folderSlug }),
    createTagField({ relationTo: tagsSlug, hasMany: true }),
  ],
  trash: true,
}
