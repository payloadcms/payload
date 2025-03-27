import type { CollectionConfig } from 'payload'

import {
  FixedToolbarFeature,
  lexicalEditor,
  TextColorFeature,
  TextStylesFeature,
} from '@payloadcms/richtext-lexical'

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
                label: 'Custom',
                light: '#A1A1AA',
                dark: '#52525B',
              },
            ],
            backgroundColors: ({ defaultColors }) => [
              ...Object.values(defaultColors),
              {
                name: 'mycustomcolor',
                label: 'Custom',
                light: '#A1A1AA',
                dark: '#52525B',
              },
            ],
          }),

          TextStylesFeature({
            // prettier-ignore
            styles: {
              color: {
                'bg-red': { label: 'Red', css: 'background-color: red;' },
                'bg-green': { label: 'Green', css: 'background-color: green;' },
                'bg-blue': { label: 'Blue', css: 'background-color: blue;' },
                'text-green': { label: 'Green', css: 'color: green;' },
                'text-blue': { label: 'Blue', css: 'color: blue;' },
              },
              gradient: {
                'galaxy': { label: 'Galaxy', css: 'background: linear-gradient(to right, #0000ff, #ff0000);' },
                'rainbow': { label: 'Rainbow', css: 'background: linear-gradient(to right, #ff0000, #ff0000, #00ff00, #0000ff);' },
                'purple-pink': { label: 'Purple Pink', css: 'background: linear-gradient(to right, #ff0000, #0000ff);' },
              },
            },
          }),
        ],
      }),
    },
  ],
}
