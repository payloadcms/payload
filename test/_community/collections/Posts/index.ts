import type { CollectionConfig } from 'payload'

import {
  defaultColors,
  FixedToolbarFeature,
  lexicalEditor,
  TextColorFeature,
  TextStylesFeature,
  TreeViewFeature,
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
              color: defaultColors,
              gradient: {
                galaxy: { label: 'Galaxy', css: { background: 'linear-gradient(to right, #0000ff, #ff0000)', color: 'white' } },
                bubble: { label: 'Bubble', css: { 'background-image': 'radial-gradient(50% 123.47% at 50% 50%, #00FF94 0%, #720059 100%), linear-gradient(121.28deg, #669600 0%, #FF0000 100%), linear-gradient(360deg, #0029FF 0%, #8FFF00 100%), radial-gradient(100% 164.72% at 100% 100%, #6100FF 0%, #00FF57 100%), radial-gradient(100% 148.07% at 0% 0%, #FFF500 0%, #51D500 100%)', 'background-blend-mode': 'screen, color-dodge, overlay, difference, normal' } },
                sunset: { label: 'Sunset', css: { background: 'linear-gradient(to top, #ff5f6d, #6a3093)' } },
              },
            },
          }),

          TreeViewFeature(),
        ],
      }),
    },
  ],
}
