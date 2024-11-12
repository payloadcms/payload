import type { CollectionConfig } from 'payload'

export const versionsSlug = 'versions'

export const Versions: CollectionConfig = {
  slug: versionsSlug,
  fields: [
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
  ],
  versions: {
    drafts: true,
  },
}
