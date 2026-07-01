import type { CollectionConfig } from 'payload'

import {
  BlocksFeature,
  CodeBlock,
  EXPERIMENTAL_TableFeature,
  FixedToolbarFeature,
  lexicalEditor,
  UploadFeature,
} from '@payloadcms/richtext-lexical'

import { richTextFieldsSlug } from '../../slugs.js'

const RichTextFields: CollectionConfig = {
  slug: richTextFieldsSlug,
  versions: {
    drafts: true,
  },
  fields: [
    {
      name: 'content',
      type: 'richText',
      admin: {
        description: 'The main content of the document.',
      },
      editor: lexicalEditor({
        features: ({ defaultFeatures }) => [
          ...defaultFeatures,
          FixedToolbarFeature(),
          UploadFeature({
            collections: {
              uploads: {
                fields: [
                  {
                    name: 'caption',
                    type: 'richText',
                  },
                  {
                    name: 'altText',
                    type: 'text',
                  },
                ],
              },
            },
          }),
          BlocksFeature({
            blocks: [
              {
                slug: 'banner',
                fields: [
                  {
                    name: 'style',
                    type: 'select',
                    options: ['info', 'warning', 'error', 'success'],
                  },
                  {
                    name: 'content',
                    type: 'richText',
                  },
                ],
              },
            ],
            inlineBlocks: [
              {
                slug: 'highlight',
                fields: [
                  {
                    name: 'text',
                    type: 'text',
                  },
                  {
                    name: 'color',
                    type: 'select',
                    options: ['yellow', 'green', 'blue', 'pink'],
                  },
                ],
              },
            ],
          }),
        ],
      }),
    },
    {
      name: 'table',
      type: 'richText',
      admin: {
        description: 'Rich text table field used to validate description spacing.',
      },
      editor: lexicalEditor({
        features: ({ defaultFeatures }) => [
          ...defaultFeatures,
          FixedToolbarFeature(),
          EXPERIMENTAL_TableFeature(),
        ],
      }),
    },
    {
      name: 'code',
      type: 'richText',
      admin: {
        description: 'Rich text code block field used to validate description spacing.',
      },
      editor: lexicalEditor({
        features: ({ defaultFeatures }) => [
          ...defaultFeatures,
          FixedToolbarFeature(),
          BlocksFeature({
            blocks: [CodeBlock()],
          }),
        ],
      }),
    },
    {
      name: 'typography',
      type: 'richText',
      admin: {
        description: 'Rich text typography field used to validate description spacing.',
      },
      editor: lexicalEditor({
        features: ({ defaultFeatures }) => [...defaultFeatures, FixedToolbarFeature()],
      }),
    },
    {
      name: 'lists',
      type: 'richText',
      admin: {
        description: 'Rich text list field used to validate description spacing.',
      },
      editor: lexicalEditor({
        features: ({ defaultFeatures }) => [...defaultFeatures, FixedToolbarFeature()],
      }),
    },
  ],
}

export default RichTextFields
