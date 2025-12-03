import type { CollectionConfig } from 'payload'

import { postsExportsOnlySlug } from '../shared.js'

export const PostsExportsOnly: CollectionConfig = {
  slug: postsExportsOnlySlug,
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['id', 'title', '_status', 'content', 'updatedAt', 'createdAt'],
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
  ],
}
