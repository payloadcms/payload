import type { CollectionConfig } from 'payload'

import {
  BlocksFeature,
  HTMLConverterFeature,
  lexicalEditor,
  lexicalHTML,
  LinkFeature,
  TreeViewFeature,
  UploadFeature,
} from '@payloadcms/richtext-lexical'
import { slateEditor } from '@payloadcms/richtext-slate'

import { richTextFieldsSlug } from '../../slugs.js'
import { RelationshipBlock, SelectFieldBlock, TextBlock, UploadAndRichTextBlock } from './blocks.js'

const RichTextFields: CollectionConfig = {
  slug: richTextFieldsSlug,
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
      name: 'lexicalCustomFields',
      type: 'richText',
      required: true,
      editor: lexicalEditor({
        features: ({ defaultFeatures }) => [
          ...defaultFeatures,
          TreeViewFeature(),
          HTMLConverterFeature({}),
          LinkFeature({
            fields: ({ defaultFields }) => [
              ...defaultFields,
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
    lexicalHTML('lexicalCustomFields', { name: 'lexicalCustomFields_html' }),
    {
      name: 'lexical',
      type: 'richText',
      admin: {
        description: 'This rich text field uses the lexical editor.',
      },
      defaultValue: {
        root: {
          children: [
            {
              children: [
                {
                  text: 'This is a paragraph.',
                  type: 'text',
                },
              ],
              direction: null,
              format: '',
              indent: 0,
              type: 'paragraph',
              version: 1,
            },
          ],
          direction: null,
          format: '',
          indent: 0,
          type: 'root',
          version: 1,
        },
      },
      editor: lexicalEditor({
        features: ({ defaultFeatures }) => [...defaultFeatures, TreeViewFeature()],
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
                    editor: slateEditor({}),
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
                    editor: slateEditor({}),
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
          slug: 'richTextBlockSlate',
          fields: [
            {
              editor: slateEditor({}),
              name: 'text',
              type: 'richText',
            },
          ],
        },
      ],
    },
  ],
}

export default RichTextFields
