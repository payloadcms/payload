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
            textColors: [
              { name: 'red', label: 'Red', light: '#ff0000', dark: '#ff0000' },
              { name: 'green', label: 'Green', light: 'green', dark: 'green' },
              { name: 'blue', label: 'Blue', light: 'blue', dark: 'blue' },
            ],
            backgroundColors: ({ defaultColors }) => [
              defaultColors.red,
              defaultColors.green,
              {
                name: 'mycustomcolor',
                label: 'My Custom Color',
                light: '#0000ff',
                dark: '#0000ff',
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
