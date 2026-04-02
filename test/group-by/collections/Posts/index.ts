import type { CollectionConfig } from 'payload'

import { categoriesSlug } from '../Categories/index.js'

export const postsSlug = 'posts'

export const PostsCollection: CollectionConfig = {
  slug: postsSlug,
  admin: {
    useAsTitle: 'title',
    groupBy: true,
    defaultColumns: ['title', 'category', 'createdAt', 'updatedAt'],
  },
  enableQueryPresets: true,
  trash: true,
  fields: [
    {
      name: 'title',
      type: 'text',
    },
    {
      name: 'category',
      type: 'relationship',
      relationTo: categoriesSlug,
    },
    {
      name: 'virtualTitleFromCategory',
      type: 'text',
      virtual: 'category.title',
      admin: {
        disableGroupBy: true,
      },
    },
    {
      name: 'page',
      type: 'relationship',
      relationTo: 'pages',
    },
    {
      name: 'virtualTitleFromPage',
      type: 'text',
      virtual: 'page.title',
    },
    {
      name: 'checkbox',
      type: 'checkbox',
    },
    {
      name: 'date',
      type: 'date',
    },
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Tab 1',
          fields: [
            {
              name: 'tab1Field',
              type: 'text',
            },
          ],
        },
      ],
    },
  ],
}
