import type { CollectionConfig } from 'payload'

import { adminOnly, authenticated } from '../../access/index.js'

export const categoriesSlug = 'categories'

export const Categories: CollectionConfig = {
  slug: categoriesSlug,
  admin: {
    defaultColumns: ['title', 'slug', 'parent', 'updatedAt'],
    useAsTitle: 'title',
  },
  access: {
    create: adminOnly,
    delete: adminOnly,
    read: authenticated,
    update: adminOnly,
  },
  fields: [
    { name: 'title', type: 'text', required: true },
    {
      name: 'slug',
      type: 'text',
      required: true,
      admin: { position: 'sidebar' },
      index: true,
    },
    {
      name: 'parent',
      type: 'relationship',
      relationTo: categoriesSlug,
      admin: { position: 'sidebar' },
      filterOptions: ({ id }) => (id ? { id: { not_equals: id } } : true),
    },
  ],
}
