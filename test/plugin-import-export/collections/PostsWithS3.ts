import type { CollectionConfig } from 'payload'

import { postsWithS3Slug } from '../shared.js'

export const PostsWithS3: CollectionConfig = {
  slug: postsWithS3Slug,
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
  ],
}
