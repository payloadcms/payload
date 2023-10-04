import type { CollectionConfig } from '../../../packages/payload/src/collections/config/types'

import { hero } from '../fields/hero'

export const pagesSlug = 'pages'

export const Pages: CollectionConfig = {
  slug: pagesSlug,
  access: {
    read: () => true,
    create: () => true,
    update: () => true,
    delete: () => true,
  },
  admin: {
    livePreview: {
      url: 'http://localhost:3001',
      breakpoints: [
        {
          label: 'Mobile',
          name: 'mobile',
          width: 375,
          height: 667,
        },
        // {
        //   label: 'Desktop',
        //   name: 'desktop',
        //   width: 1440,
        //   height: 900,
        // },
      ],
    },
    useAsTitle: 'title',
    defaultColumns: ['id', 'title', 'slug', 'createdAt'],
  },
  fields: [
    {
      name: 'slug',
      type: 'text',
      required: true,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Hero',
          fields: [hero],
        },
        {
          label: 'Content',
          fields: [
            {
              name: 'layout',
              type: 'blocks',
              blocks: [
                {
                  slug: 'hero',
                  labels: {
                    singular: 'Hero',
                    plural: 'Hero',
                  },
                  fields: [
                    {
                      name: 'title',
                      type: 'text',
                      required: true,
                    },
                    {
                      name: 'description',
                      type: 'textarea',
                      required: true,
                    },
                  ],
                },
              ],
            },
            {
              name: 'featuredPosts',
              type: 'relationship',
              relationTo: 'posts',
              hasMany: true,
            },
            {
              name: 'meta',
              type: 'group',
              fields: [
                {
                  name: 'title',
                  type: 'text',
                },
                {
                  name: 'description',
                  type: 'textarea',
                },
              ],
            },
          ],
        },
      ],
    },
  ],
}
