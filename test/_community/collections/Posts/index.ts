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
