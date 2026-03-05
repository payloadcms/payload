import type { CollectionConfig } from 'payload'

import { createTagField } from 'payload'

import { articlesSlug, tagsSlug } from '../../shared.js'

export const Articles: CollectionConfig = {
  slug: articlesSlug,
  admin: {
    useAsTitle: 'title',
  },
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'content', type: 'textarea' },
    createTagField({
      name: 'primaryTag',
      relationTo: tagsSlug,
      hasMany: false,
      label: 'Primary Tag',
    }),
    createTagField({
      name: 'tags',
      relationTo: tagsSlug,
      hasMany: true,
      label: 'Tags',
    }),
  ],
}
