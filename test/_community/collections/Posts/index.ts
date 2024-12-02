import type { CollectionConfig } from 'payload'

import {
  FixedToolbarFeature,
  InlineToolbarFeature,
  lexicalEditor,
  TextAttributesFeature,
  TextColorFeature,
  TreeViewFeature,
} from '@payloadcms/richtext-lexical'
import { BackgroundColor } from 'live-preview/app/live-preview/_components/BackgroundColor/index.js'

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
          ...defaultFeatures.filter((feature) => feature === InlineToolbarFeature()),
          FixedToolbarFeature(),
          TextAttributesFeature({
            color: (value) => (['blue', 'green', 'red'].includes(value) ? value : undefined),
            backgroundColor: (value) => (['pink', 'yellow'].includes(value) ? value : undefined),
            // colors: [
            //   { label: 'yellow', value: '#ffff00' },
            //   { label: 'pink', value: '#ffc0cb' },
            // ],
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
          TreeViewFeature(),
        ],
      }),
    },
  ],
  versions: {
    drafts: true,
  },
}
