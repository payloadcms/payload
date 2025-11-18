import type { CollectionConfig } from 'payload'

import { BlocksFeature, lexicalEditor } from '@payloadcms/richtext-lexical'

import { lexicalLocalizedFieldsSlug } from '../../slugs.js'

export const LexicalLocalizedFields: CollectionConfig = {
  slug: lexicalLocalizedFieldsSlug,
  admin: {
    useAsTitle: 'title',
    listSearchableFields: ['title'],
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      localized: true,
    },
    {
      name: 'lexicalBlocksSubLocalized',
      type: 'richText',
      admin: {
        description: 'Non-localized field with localized block subfields',
      },
      editor: lexicalEditor({
        features: ({ defaultFeatures }) => [
          ...defaultFeatures,
          BlocksFeature({
            blocks: [
              {
                slug: 'blockLexicalLocalized',
                fields: [
                  {
                    name: 'textLocalized',
                    type: 'text',
                    localized: true,
                  },
                  {
                    name: 'counter',
                    type: 'number',
                    hooks: {
                      beforeChange: [
                        ({ value }) => {
                          return value ? value + 1 : 1
                        },
                      ],
                      afterRead: [
                        ({ value }) => {
                          return value ? value * 10 : 10
                        },
                      ],
                    },
                  },
                  {
                    name: 'rel',
                    type: 'relationship',
                    relationTo: lexicalLocalizedFieldsSlug,
                  },
                ],
              },
            ],
          }),
        ],
      }),
    },
    {
      name: 'lexicalBlocksLocalized',
      admin: {
        description: 'Localized field with localized block subfields',
      },
      type: 'richText',
      localized: true,
      editor: lexicalEditor({
        features: ({ defaultFeatures }) => [
          ...defaultFeatures,
          BlocksFeature({
            blocks: [
              {
                slug: 'blockLexicalLocalized2',
                fields: [
                  {
                    name: 'textLocalized',
                    type: 'text',
                    localized: true,
                  },
                  {
                    name: 'rel',
                    type: 'relationship',
                    relationTo: lexicalLocalizedFieldsSlug,
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
