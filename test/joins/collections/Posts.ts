import type { CollectionConfig } from 'payload'

import { categoriesSlug, postsSlug, uploadsSlug } from '../shared.js'

export const Posts: CollectionConfig = {
  slug: postsSlug,
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'category', 'updatedAt', 'createdAt'],
  },
  fields: [
    {
      name: 'title',
      type: 'text',
    },
    {
      name: 'isFiltered',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        position: 'sidebar',
        description: 'Hides posts for the `filtered` join field in categories',
      },
    },
    {
      name: 'restrictedField',
      type: 'text',
      access: {
        read: () => false,
        update: () => false,
      },
    },
    {
      name: 'upload',
      type: 'upload',
      relationTo: uploadsSlug,
    },
    {
      name: 'category',
      type: 'relationship',
      relationTo: categoriesSlug,
    },
    {
      name: 'categories',
      type: 'relationship',
      relationTo: categoriesSlug,
      hasMany: true,
    },
    {
      name: 'categoriesLocalized',
      type: 'relationship',
      relationTo: categoriesSlug,
      hasMany: true,
      localized: true,
    },
    {
      name: 'group',
      type: 'group',
      fields: [
        {
          name: 'category',
          type: 'relationship',
          relationTo: categoriesSlug,
        },
        {
          name: 'camelCaseCategory',
          type: 'relationship',
          relationTo: categoriesSlug,
        },
      ],
    },
  ],
}
