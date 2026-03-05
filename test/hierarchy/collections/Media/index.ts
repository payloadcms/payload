import type { CollectionConfig } from 'payload'

import { createFolderField, createTagField } from 'payload'

import { foldersSlug, mediaSlug, tagsSlug } from '../../shared.js'

export const Media: CollectionConfig = {
  slug: mediaSlug,
  admin: {
    useAsTitle: 'filename',
  },
  fields: [
    { name: 'filename', type: 'text' },
    createFolderField({ relationTo: foldersSlug }),
    createTagField({ relationTo: tagsSlug, hasMany: true }),
  ],
  upload: true,
}
