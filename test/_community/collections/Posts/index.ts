import type { CollectionConfig } from 'payload'

import { FixedToolbarFeature, lexicalEditor, TextColorFeature } from '@payloadcms/richtext-lexical'

export const postsSlug = 'posts'

export const PostsCollection: CollectionConfig = {
  slug: postsSlug,
  admin: {
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
    },
    {
      name: 'content',
      type: 'richText',
      editor: lexicalEditor({
        features: ({ defaultFeatures }) => [
          ...defaultFeatures,
          FixedToolbarFeature(),

          TextColorFeature({
            textColors: ({ defaultColors }) => [
              ...Object.values(defaultColors),
              {
                name: 'mycustomcolor',
                label: 'My Custom Color',
                light: '#A1A1AA',
                dark: '#52525B',
              },
            ],
            backgroundColors: ({ defaultColors }) => [
              ...Object.values(defaultColors),
              {
                name: 'mycustomcolor',
                label: 'My Custom Color',
                light: '#A1A1AA',
                dark: '#52525B',
              },
            ],

            // normalizeColor: (color) => {
            //   if (color !== '#ff0000' && color !== 'green' && color !== 'blue') {
            //     return null
            //   }
            //   return color
            // },
          }),
        ],
      }),
    },
  ],
}
