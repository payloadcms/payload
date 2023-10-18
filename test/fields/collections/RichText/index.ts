import type { CollectionConfig } from '../../../../packages/payload/src/collections/config/types'

import {
  BlocksFeature,
  HTMLConverterFeature,
  LinkFeature,
  TreeviewFeature,
  UploadFeature,
  lexicalEditor,
} from '../../../../packages/richtext-lexical/src'
import { lexicalHTML } from '../../../../packages/richtext-lexical/src/field/features/converters/html/field'
import { slateEditor } from '../../../../packages/richtext-slate/src'
import { RelationshipBlock, SelectFieldBlock, TextBlock, UploadAndRichTextBlock } from './blocks'
import { generateLexicalRichText } from './generateLexicalRichText'
import { generateSlateRichText } from './generateSlateRichText'

const RichTextFields: CollectionConfig = {
  slug: 'rich-text-fields',
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
    lexicalHTML('richTextLexicalCustomFields', { name: 'richTextLexicalCustomFields_htmll' }),
    {
      name: 'richTextLexicalCustomFields',
      type: 'richText',
      required: true,
      editor: lexicalEditor({
        features: ({ defaultFeatures }) => [
          ...defaultFeatures,
          TreeviewFeature(),
          HTMLConverterFeature({}),
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
            blocks: [TextBlock, UploadAndRichTextBlock, SelectFieldBlock, RelationshipBlock],
          }),
        ],
      }),
    },
    {
      name: 'richTextLexical',
      type: 'richText',
      editor: lexicalEditor({
        features: ({ defaultFeatures }) => [...defaultFeatures, TreeviewFeature()],
      }),
    },
    {
      name: 'selectHasMany',
      hasMany: true,
      type: 'select',
      admin: {
        description:
          'This select field is rendered here to ensure its options dropdown renders above the rich text toolbar.',
      },
      options: [
        {
          label: 'Value One',
          value: 'one',
        },
        {
          label: 'Value Two',
          value: 'two',
        },
        {
          label: 'Value Three',
          value: 'three',
        },
        {
          label: 'Value Four',
          value: 'four',
        },
        {
          label: 'Value Five',
          value: 'five',
        },
        {
          label: 'Value Six',
          value: 'six',
        },
      ],
    },
    {
      name: 'richText',
      type: 'richText',
      editor: slateEditor({
        admin: {
          elements: [
            'h1',
            'h2',
            'h3',
            'h4',
            'h5',
            'h6',
            'ul',
            'ol',
            'textAlign',
            'indent',
            'link',
            'relationship',
            'upload',
          ],
          link: {
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
          },
          upload: {
            collections: {
              uploads: {
                fields: [
                  {
                    name: 'caption',
                    type: 'richText',
                  },
                ],
              },
            },
          },
        },
      }),
      required: true,
    },
    {
      name: 'richTextCustomFields',
      type: 'richText',
      editor: slateEditor({
        admin: {
          elements: [
            'h1',
            'h2',
            'h3',
            'h4',
            'h5',
            'h6',
            'ul',
            'ol',
            'indent',
            'link',
            'relationship',
            'upload',
          ],
          link: {
            fields: ({ defaultFields }) => {
              return [
                ...defaultFields,
                {
                  label: 'Custom',
                  name: 'customLinkField',
                  type: 'text',
                },
              ]
            },
          },
          upload: {
            collections: {
              uploads: {
                fields: [
                  {
                    name: 'caption',
                    type: 'richText',
                  },
                ],
              },
            },
          },
        },
      }),
    },
    {
      name: 'richTextReadOnly',
      type: 'richText',
      admin: {
        readOnly: true,
      },
      editor: slateEditor({
        admin: {
          elements: [
            'h1',
            'h2',
            'h3',
            'h4',
            'h5',
            'h6',
            'ul',
            'ol',
            'indent',
            'link',
            'relationship',
            'upload',
          ],
          link: {
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
          },
          upload: {
            collections: {
              uploads: {
                fields: [
                  {
                    name: 'caption',
                    type: 'richText',
                  },
                ],
              },
            },
          },
        },
      }),
    },
    {
      name: 'blocks',
      type: 'blocks',
      blocks: [
        {
          slug: 'textBlock',
          fields: [
            {
              name: 'text',
              type: 'text',
            },
          ],
        },
        {
          slug: 'richTextBlock',
          fields: [
            {
              name: 'text',
              type: 'richText',
            },
          ],
        },
      ],
    },
  ],
}

export const richTextBulletsDoc = {
  title: 'Bullets and Indentation',
  richTextLexicalCustomFields: generateLexicalRichText(),
  richText: [
    {
      type: 'ul',
      children: [
        {
          type: 'li',
          children: [
            {
              children: [
                {
                  text: 'I am semantically connected to my sub-bullets',
                },
              ],
            },
            {
              type: 'ul',
              children: [
                {
                  type: 'li',
                  children: [
                    {
                      text: 'I am sub-bullets that are semantically connected to the parent bullet',
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          children: [
            {
              text: 'Normal bullet',
            },
          ],
          type: 'li',
        },
        {
          type: 'li',
          children: [
            {
              type: 'ul',
              children: [
                {
                  type: 'li',
                  children: [
                    {
                      text: 'I am the old style of sub-bullet',
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          type: 'li',
          children: [
            {
              text: 'Another normal bullet',
            },
          ],
        },
        {
          type: 'li',
          children: [
            {
              children: [
                {
                  text: 'This text precedes a nested list',
                },
              ],
            },
            {
              type: 'ul',
              children: [
                {
                  type: 'li',
                  children: [
                    {
                      text: 'I am a sub-bullet',
                    },
                  ],
                },
                {
                  type: 'li',
                  children: [
                    {
                      text: 'And I am another sub-bullet',
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  ],
}

export const richTextBlocks = [
  {
    blockType: 'textBlock',
    text: 'Regular text',
  },
  {
    blockType: 'richTextBlock',
    text: [
      {
        children: [
          {
            text: 'Rich text',
          },
        ],
        type: 'h1',
      },
    ],
  },
]
export const richTextDoc = {
  title: 'Rich Text',
  selectHasMany: ['one', 'five'],
  richText: generateSlateRichText(),
  richTextReadOnly: generateSlateRichText(),
  richTextCustomFields: generateSlateRichText(),
  richTextLexicalCustomFields: generateLexicalRichText(),
  blocks: richTextBlocks,
}

export default RichTextFields
