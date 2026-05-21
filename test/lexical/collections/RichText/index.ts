import type { CollectionConfig } from 'payload'

import {
  BlocksFeature,
  lexicalEditor,
  lexicalHTMLField,
  LinkFeature,
  TreeViewFeature,
  UploadFeature,
} from '@payloadcms/richtext-lexical'

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
    lexicalHTMLField({
      htmlFieldName: 'lexicalCustomFields_html',
      lexicalFieldName: 'lexicalCustomFields',
      converters: ({ defaultConverters }) => ({
        ...defaultConverters,
        link: async ({ node, nodesToHTML, providedStyleTag }) => {
          const children = (await nodesToHTML({ nodes: node.children })).join('')
          const href = node.fields.linkType === 'internal' ? '#' : (node.fields.url ?? '')
          const newTabAttrs = node.fields.newTab ? ' rel="noopener noreferrer" target="_blank"' : ''
          return `<a${providedStyleTag} href="${href}"${newTabAttrs}>${children}</a>`
        },
      }),
    }),
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
      ],
    },
  ],
}

export default RichTextFields
