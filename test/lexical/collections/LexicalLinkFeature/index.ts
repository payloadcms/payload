import type { CheckboxField, CollectionConfig } from 'payload'

import {
  FixedToolbarFeature,
  lexicalEditor,
  LinkFeature,
  TreeViewFeature,
  UploadFeature,
} from '@payloadcms/richtext-lexical'

import { lexicalLinkFeatureAutosaveSlug, lexicalLinkFeatureSlug, uploadsSlug } from '../../slugs.js'

const createLexicalLinkFeature = ({
  slug,
  versions,
}: {
  slug: string
  versions?: CollectionConfig['versions']
}): CollectionConfig => ({
  slug,
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
                {
                  name: 'someText',
                  type: 'text',
                  access: {
                    read: ({ req }) => req.headers.get('x-hide-lexical-fields') !== 'true',
                  },
                },
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
                          access: {
                            read: ({ req }) => req.headers.get('x-hide-lexical-fields') !== 'true',
                          },
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
          UploadFeature({
            collections: {
              [uploadsSlug]: {
                fields: [{ name: 'caption', type: 'text', defaultValue: 'Server caption' }],
              },
            },
          }),
        ],
      }),
    },
  ],
  versions: versions ?? false,
})

export const LexicalLinkFeature = createLexicalLinkFeature({
  slug: lexicalLinkFeatureSlug,
})

export const LexicalLinkFeatureAutosave = createLexicalLinkFeature({
  slug: lexicalLinkFeatureAutosaveSlug,
  versions: {
    drafts: {
      autosave: {
        interval: 8000,
      },
    },
  },
})
