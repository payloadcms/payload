import type { CollectionConfig } from 'payload'

export const singularSlug = 'singular'

export const Singular: CollectionConfig = {
  slug: singularSlug,
  fields: [
    {
      type: 'relationship',
      relationTo: 'categories',
      name: 'category',
    },
  ],
}
