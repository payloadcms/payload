import type { CollectionConfig } from 'payload'

import { devUser } from '../../credentials.js'
import { postsExportsOnlySlug } from '../shared.js'

export const PostsExportsOnly: CollectionConfig = {
  slug: postsExportsOnlySlug,
  labels: {
    singular: 'Posts Exports Only',
    plural: 'Posts Exports Only',
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['id', 'title', '_status', 'content', 'updatedAt', 'createdAt'],
  },
  access: {
    // Only allow read for users with the dev email (admin)
    // Restricted users should not be able to export
    read: ({ req }) => {
      if (!req.user) {
        return false
      }
      return req.user.email === devUser.email
    },
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
