import type { CollectionConfig } from 'payload'

import {
  BlocksFeature,
  defaultColors,
  EXPERIMENTAL_TableFeature,
  FixedToolbarFeature,
  lexicalEditor,
  TextStateFeature,
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
        // Try to keep feature props simple and minimal in this collection
        features: ({ defaultFeatures }) => [
          ...defaultFeatures,
          TreeViewFeature(),
          FixedToolbarFeature(),
          EXPERIMENTAL_TableFeature(),
          TextStateFeature({
            state: {
              color: { ...defaultColors.text },
              backgroundColor: { ...defaultColors.background },
            },
          }),
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
              {
                slug: 'inlineBlockWithRelationship',
                fields: [
                  {
                    name: 'relationship',
                    type: 'relationship',
                    relationTo: 'text-fields',
                    admin: {
                      // Required to reproduce issue: https://github.com/payloadcms/payload/issues/13778
                      appearance: 'drawer',
                    },
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
