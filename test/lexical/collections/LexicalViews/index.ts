import type { CollectionConfig } from 'payload'

import { BlocksFeature, lexicalEditor } from '@payloadcms/richtext-lexical'

import { lexicalViewsSlug } from '../../slugs.js'

export const LexicalViews: CollectionConfig = {
  slug: lexicalViewsSlug,
  labels: {
    singular: 'Lexical Views',
    plural: 'Lexical Views',
  },
  fields: [
    {
      name: 'customViews',
      type: 'richText',
      editor: lexicalEditor({
        views: './collections/LexicalViews/views.js#lexicalViews',
        features: ({ defaultFeatures }) => [
          ...defaultFeatures,
          BlocksFeature({
            blocks: [
              {
                slug: 'customViewsTestBlock',
                fields: [
                  {
                    name: 'text',
                    type: 'text',
                  },
                ],
              },
            ],
          }),
        ],
      }),
    },
    {
      name: 'vanillaViews',
      type: 'richText',
      editor: lexicalEditor({
        features: ({ defaultFeatures }) => [
          ...defaultFeatures,
          BlocksFeature({
            blocks: [
              {
                slug: 'vanillaViewsTestBlock',
                fields: [
                  {
                    name: 'text',
                    type: 'text',
                  },
                ],
              },
            ],
          }),
        ],
      }),
    },
  ],
}
