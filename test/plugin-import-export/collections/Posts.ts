import type { CollectionConfig } from 'payload'

import { postsSlug } from '../shared.js'

export const Posts: CollectionConfig = {
  slug: postsSlug,
  admin: {
    useAsTitle: 'title',
    defaultColumns: [
      'id',
      'title',
      'disabledForImportExport',
      '_status',
      'content',
      'updatedAt',
      'createdAt',
    ],
  },
  versions: {
    drafts: true,
  },
  fields: [
    {
      name: 'title',
      label: { en: 'Title', es: 'Título', de: 'Titel' },
      type: 'text',
      required: true,
    },
    {
      name: 'content',
      type: 'richText',
    },
    {
      name: 'disabledForImportExport',
      type: 'text',
      custom: {
        'plugin-import-export': {
          disabled: true,
        },
      },
    },
  ],
}
