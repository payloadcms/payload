import type { CollectionConfig } from 'payload'

import { autosaveWithMultiSelectCollectionSlug } from '../slugs.js'

const AutosaveWithMultiSelectPosts: CollectionConfig = {
  slug: autosaveWithMultiSelectCollectionSlug,
  versions: {
    drafts: {
      autosave: {
        interval: 2000,
      },
    },
  },
  fields: [
    {
      name: 'title',
      label: 'Title',
      type: 'text',
      required: true,
      unique: true,
      localized: true,
    },
    {
      name: 'tag',
      type: 'select',
      options: ['blog', 'essay', 'portfolio'],
      hasMany: true,
    },
  ],
}

export default AutosaveWithMultiSelectPosts
