import type { CheckboxField, CollectionConfig } from 'payload'

import {
  BlocksFeature,
  EXPERIMENTAL_TableFeature,
  FixedToolbarFeature,
  lexicalEditor,
  LinkFeature,
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
          LinkFeature({
            fields: ({ defaultFields }) => {
              const modifiedFields = defaultFields.map((field) => {
                if (field.name === 'newTab') {
                  return { ...field, defaultValue: true } as CheckboxField
                }

                return field
              })

              return [...modifiedFields, { type: 'text', name: 'someText' }]
            },
          }),
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
