import type { CollectionConfig } from 'payload'

import { lexicalEditor } from '@payloadcms/richtext-lexical'

export const postsSlug = 'posts'

export const PostsCollection: CollectionConfig = {
  slug: postsSlug,
  admin: {},
  fields: [
    {
      name: 'array',
      type: 'array',
      fields: [
        {
          name: 'title',
          type: 'text',
          admin: {
            components: {
              Field: '/TitleField.js#TitleField',
            },
          },
        },
      ],
    },

    {
      name: 'check',
      type: 'checkbox',
    },
    {
      name: 'content',
      type: 'richText',
      editor: lexicalEditor({
        features: ({ defaultFeatures }) => [...defaultFeatures],
      }),
    },
  ],
}
