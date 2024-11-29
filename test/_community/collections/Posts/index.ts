import type { CollectionConfig } from 'payload'

import {
  FixedToolbarFeature,
  lexicalEditor,
  TextAttributesFeature,
  TextColorFeature,
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
          TextAttributesFeature({
            colors: [
              { label: 'yellow', value: '#ffff00' },
              { label: 'pink', value: '#ffc0cb' },
            ],
            // normalizeColor: (color) => {
            //   if (color !== '#ff0000' && color !== 'green' && color !== 'blue') {
            //     return null
            //   }
            //   return color
            // },
          }),
          TextColorFeature({
            colors: [
              { label: 'Red', value: '#ff0000' },
              { label: 'Green', value: 'green' },
              { label: 'Blue', value: 'blue' },
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
  versions: {
    drafts: true,
  },
}
