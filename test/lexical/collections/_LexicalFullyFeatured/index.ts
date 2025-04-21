import type { CollectionConfig } from 'payload'

import {
  BlocksFeature,
  EXPERIMENTAL_TableFeature,
  FixedToolbarFeature,
  lexicalEditor,
  TreeViewFeature,
} from '@payloadcms/richtext-lexical'

import { lexicalFullyFeaturedSlug } from '../../slugs.js'

export const LexicalFullyFeatured: CollectionConfig = {
  slug: lexicalFullyFeaturedSlug,
  labels: {
    singular: 'Lexical Fully Featured',
    plural: 'Lexical Fully Featured',
  },
  fields: [
    {
      name: 'richText',
      type: 'richText',
      editor: lexicalEditor({
        features: ({ defaultFeatures }) => [
          ...defaultFeatures,
          TreeViewFeature(),
          FixedToolbarFeature(),
          EXPERIMENTAL_TableFeature(),
          BlocksFeature({
            blocks: [
              {
                slug: 'myBlock',
                fields: [
                  {
                    name: 'someText',
                    type: 'text',
                  },
                ],
              },
            ],
            inlineBlocks: [
              {
                slug: 'myInlineBlock',
                fields: [
                  {
                    name: 'someText',
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
