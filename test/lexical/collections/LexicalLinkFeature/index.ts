import type { CheckboxField, CollectionConfig } from 'payload'

import {
  FixedToolbarFeature,
  lexicalEditor,
  LinkFeature,
  TreeViewFeature,
} from '@payloadcms/richtext-lexical'

import { lexicalLinkFeatureSlug } from '../../slugs.js'

export const LexicalLinkFeature: CollectionConfig = {
  slug: lexicalLinkFeatureSlug,
  labels: {
    singular: 'Lexical Link Feature',
    plural: 'Lexical Link Feature',
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
        ],
      }),
    },
    {
      name: 'richTextNestedFields',
      type: 'richText',
      editor: lexicalEditor({
        features: ({ defaultFeatures }) => [
          ...defaultFeatures,
          TreeViewFeature(),
          LinkFeature({
            // Test that LinkFeature works when fields are wrapped in a row layout
            fields: ({ defaultFields }) => [
              {
                type: 'row',
                fields: defaultFields,
              },
              { type: 'text', name: 'customField' },
            ],
          }),
          FixedToolbarFeature(),
        ],
      }),
    },
  ],
}
