import type { CollectionConfig } from 'payload'

import {
  FixedToolbarFeature,
  InlineToolbarFeature,
  lexicalEditor,
  TextClassesFeature,
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
          ...defaultFeatures.filter((feature) => feature === InlineToolbarFeature()),
          FixedToolbarFeature(),
          TextClassesFeature({
            settings: [
              {
                classPrefix: 'color',
                classSuffixes: ['blue', 'green', 'red'],
                toolbarInline: false,
                childComponent: './TextColorIcon',
              },
              {
                classPrefix: 'bg-color',
                classSuffixes: ['pink', 'yellow'],
                childComponent: './BackgroundColorIcon',
              },
            ],
          }),
          // TextColorFeature({
          //   colors: [
          //     { label: 'Red', value: '#ff0000' },
          //     { label: 'Green', value: 'green' },
          //     { label: 'Blue', value: 'blue' },
          //   ],
          //   // normalizeColor: (color) => {
          //   //   if (color !== '#ff0000' && color !== 'green' && color !== 'blue') {
          //   //     return null
          //   //   }
          //   //   return color
          //   // },
          // }),
          TreeViewFeature(),
        ],
      }),
    },
  ],
  versions: {
    drafts: true,
  },
}
