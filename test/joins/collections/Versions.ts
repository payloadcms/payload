import type { CollectionConfig } from 'payload'

export const versionsSlug = 'versions'

export const Versions: CollectionConfig = {
  slug: versionsSlug,
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
    },
    {
      name: 'categoryVersions',
      relationTo: 'categories-versions',
      type: 'relationship',
      hasMany: true,
    },
  ],
  versions: {
    drafts: true,
  },
}
