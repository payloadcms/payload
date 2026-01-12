import type { CollectionConfig } from 'payload'

import { versionsSlug } from '../shared.js'

export const Versions: CollectionConfig = {
  slug: versionsSlug,
  labels: {
    singular: 'Post With Versions',
    plural: 'Posts With Versions',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'category',
      relationTo: 'categories',
      type: 'relationship',
    },
    {
      name: 'categoryVersion',
      relationTo: 'categories-versions',
      type: 'relationship',
      label: 'Category With Versions',
    },
    {
      name: 'categoryVersions',
      relationTo: 'categories-versions',
      type: 'relationship',
      hasMany: true,
      label: 'Categories With Versions (Has Many)',
    },
  ],
  versions: {
    drafts: {
      autosave: true,
    },
  },
}
