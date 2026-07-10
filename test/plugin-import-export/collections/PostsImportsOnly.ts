import type { CollectionConfig } from 'payload'

import { devUser } from '../../credentials.js'
import { postsImportsOnlySlug } from '../shared.js'

export const PostsImportsOnly: CollectionConfig = {
  slug: postsImportsOnlySlug,
  labels: {
    singular: 'Posts Imports Only',
    plural: 'Posts Imports Only',
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['id', 'title', '_status', 'content', 'updatedAt', 'createdAt'],
  },
  access: {
    // Only allow create/update for users with the dev email (admin)
    // Restricted users should not be able to import
    create: ({ req }) => {
      if (!req.user) {
        return false
      }
      return req.user.email === devUser.email
    },
    update: ({ req }) => {
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
