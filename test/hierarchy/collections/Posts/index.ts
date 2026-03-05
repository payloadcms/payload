import type { CollectionConfig } from 'payload'

import { createFolderField, createTagField } from 'payload'

import { foldersSlug, postsSlug, tagsSlug } from '../../shared.js'

export const Posts: CollectionConfig = {
  slug: postsSlug,
  admin: {
    useAsTitle: 'title',
  },
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'content', type: 'textarea' },
    createFolderField({ relationTo: foldersSlug }),
    createTagField({ relationTo: tagsSlug, hasMany: true }),
  ],
  trash: true,
}
