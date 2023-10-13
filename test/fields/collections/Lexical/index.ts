import type { CollectionConfig } from '../../../../packages/payload/src/collections/config/types'

import {
  BlocksFeature,
  LinkFeature,
  TreeviewFeature,
  UploadFeature,
  lexicalEditor,
} from '../../../../packages/richtext-lexical/src'
import {
  RelationshipBlock,
  RichTextBlock,
  SelectFieldBlock,
  SubBlockBlock,
  TextBlock,
  UploadAndRichTextBlock,
} from './blocks'
import { generateLexicalRichText } from './generateLexicalRichText'

export const LexicalFields: CollectionConfig = {
  slug: 'lexical-fields',
  admin: {
    useAsTitle: 'title',
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
      name: 'richTextLexicalCustomFields',
      type: 'richText',
      required: true,
      editor: lexicalEditor({
        features: ({ defaultFeatures }) => [
          ...defaultFeatures,
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
          BlocksFeature({
            blocks: [
              RichTextBlock,
              TextBlock,
              UploadAndRichTextBlock,
              SelectFieldBlock,
              RelationshipBlock,
              SubBlockBlock,
            ],
          }),
        ],
      }),
    },
  ],
}

export const LexicalRichTextDoc = {
  title: 'Rich Text',
  richTextLexicalCustomFields: generateLexicalRichText(),
}
