import type { CollectionConfig } from '../../../../packages/payload/src/collections/config/types'

import {
  LexicalPluginToLexicalFeature,
  LinkFeature,
  TreeviewFeature,
  UploadFeature,
  lexicalEditor,
} from '../../../../packages/richtext-lexical/src'
import { lexicalMigrateFieldsSlug } from '../../collectionSlugs'
import { payloadPluginLexicalData } from './generatePayloadPluginLexicalData'

export const LexicalMigrateFields: CollectionConfig = {
  slug: lexicalMigrateFieldsSlug,
  admin: {
    useAsTitle: 'title',
    listSearchableFields: ['title', 'richTextLexicalCustomFields'],
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'richTextLexicalWithLexicalPluginData',
      type: 'richText',
      editor: lexicalEditor({
        features: ({ defaultFeatures }) => [
          ...defaultFeatures,
          LexicalPluginToLexicalFeature(),
          TreeviewFeature(),
          LinkFeature({
            fields: [
              {
                name: 'rel',
                label: 'Rel Attribute',
                type: 'select',
                hasMany: true,
                options: ['noopener', 'noreferrer', 'nofollow'],
                admin: {
                  description:
                    'The rel attribute defines the relationship between a linked resource and the current document. This is a custom link field.',
                },
              },
            ],
          }),
          UploadFeature({
            collections: {
              uploads: {
                fields: [
                  {
                    name: 'caption',
                    type: 'richText',
                    editor: lexicalEditor(),
                  },
                ],
              },
            },
          }),
        ],
      }),
    },
  ],
}

export const LexicalRichTextDoc = {
  title: 'Rich Text',
  richTextLexicalWithLexicalPluginData: payloadPluginLexicalData,
}
