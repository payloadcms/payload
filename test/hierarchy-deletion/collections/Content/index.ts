import type { CollectionConfig } from 'payload'

import { createFolderField, createTagField } from 'payload'

import { contentSlug, foldersSlug, tagsSlug } from '../../shared.js'

export const Content: CollectionConfig = {
  slug: contentSlug,
  access: { create: () => true, delete: () => true, read: () => true, update: () => true },
  fields: [
    { name: 'title', type: 'text', required: true },
    createFolderField({ relationTo: foldersSlug }),
    createTagField({ hasMany: true, relationTo: tagsSlug }),
  ],
}
