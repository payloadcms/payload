import type { CheckboxField, CollectionConfig } from 'payload'

import {
  FixedToolbarFeature,
  lexicalEditor,
  LinkFeature,
  TreeViewFeature,
} from '@payloadcms/richtext-lexical'

import { lexicalLinkFeatureSlug, uploadsSlug } from '../../slugs.js'

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

              return [
                ...modifiedFields,
                { name: 'someText', type: 'text' },
                {
                  name: 'hyperlink',
                  type: 'blocks',
                  blocks: [
                    {
                      slug: 'assetLink',
                      fields: [
                        {
                          name: 'label',
                          type: 'text',
                        },
                        {
                          name: 'asset',
                          type: 'upload',
                          relationTo: uploadsSlug,
                        },
                      ],
                      labels: {
                        plural: 'Asset Link Blocks',
                        singular: 'Asset Link Block',
                      },
                    },
                  ],
                  maxRows: 1,
                },
              ]
            },
          }),
          FixedToolbarFeature(),
        ],
      }),
    },
  ],
}
