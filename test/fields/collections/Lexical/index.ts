import type { CollectionConfig } from '../../../../packages/payload/src/collections/config/types.js'

import {
  BlocksFeature,
  LinkFeature,
  TreeViewFeature,
  UploadFeature,
  lexicalEditor,
} from '../../../../packages/richtext-lexical/src/index.js'
import { lexicalFieldsSlug } from '../../slugs.js'
import {
  ConditionalLayoutBlock,
  RadioButtonsBlock,
  RelationshipBlock,
  RelationshipHasManyBlock,
  RichTextBlock,
  SelectFieldBlock,
  SubBlockBlock,
  TextBlock,
  UploadAndRichTextBlock,
} from './blocks.js'

export const LexicalFields: CollectionConfig = {
  slug: lexicalFieldsSlug,
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
      name: 'lexicalSimple',
      type: 'richText',
      editor: lexicalEditor({
        features: ({ defaultFeatures }) => [
          ...defaultFeatures,
          //TestRecorderFeature(),
          TreeViewFeature(),
          BlocksFeature({
            blocks: [
              RichTextBlock,
              TextBlock,
              UploadAndRichTextBlock,
              SelectFieldBlock,
              RelationshipBlock,
              RelationshipHasManyBlock,
              SubBlockBlock,
              RadioButtonsBlock,
              ConditionalLayoutBlock,
            ],
          }),
        ],
      }),
    },
    {
      name: 'lexicalWithBlocks',
      type: 'richText',
      required: true,
      editor: lexicalEditor({
        features: ({ defaultFeatures }) => [
          ...defaultFeatures,
          //TestRecorderFeature(),
          TreeViewFeature(),
          //HTMLConverterFeature(),
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
              RelationshipHasManyBlock,
              SubBlockBlock,
              RadioButtonsBlock,
              ConditionalLayoutBlock,
            ],
          }),
        ],
      }),
    },
  ],
}
