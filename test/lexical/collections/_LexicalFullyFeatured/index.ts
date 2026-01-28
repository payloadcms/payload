import type { CollectionConfig } from 'payload'

import {
  BlocksFeature,
  CodeBlock,
  defaultColors,
  EXPERIMENTAL_TableFeature,
  FixedToolbarFeature,
  lexicalEditor,
  TextStateFeature,
  TreeViewFeature,
} from '@payloadcms/richtext-lexical'

import { lexicalFullyFeaturedSlug } from '../../slugs.js'

export const LexicalFullyFeatured: CollectionConfig = {
  slug: lexicalFullyFeaturedSlug,
  labels: {
    singular: 'Lexical Fully Featured',
    plural: 'Lexical Fully Featured',
  },
  fields: [
    {
      name: 'richText',
      type: 'richText',
      editor: lexicalEditor({
        // Try to keep feature props simple and minimal in this collection
        features: ({ defaultFeatures }) => [
          ...defaultFeatures,
          TreeViewFeature(),
          FixedToolbarFeature(),
          EXPERIMENTAL_TableFeature(),
          TextStateFeature({
            state: {
              color: { ...defaultColors.text },
              backgroundColor: { ...defaultColors.background },
            },
          }),
          BlocksFeature({
            blocks: [
              CodeBlock(),
              CodeBlock({
                slug: 'PayloadCode',
                defaultLanguage: 'ts',
                languages: {
                  js: 'JavaScript',
                  ts: 'TypeScript',
                  json: 'JSON',
                  plaintext: 'Plain Text',
                },
                typescript: {
                  fetchTypes: [
                    {
                      url: 'https://unpkg.com/payload@3.59.0-internal.8435f3c/dist/index.bundled.d.ts',
                      filePath: 'file:///node_modules/payload/index.d.ts',
                    },
                    {
                      url: 'https://unpkg.com/@types/react@19.1.17/index.d.ts',
                      filePath: 'file:///node_modules/@types/react/index.d.ts',
                    },
                  ],
                  paths: {
                    payload: ['file:///node_modules/payload/index.d.ts'],
                    react: ['file:///node_modules/@types/react/index.d.ts'],
                  },
                  typeRoots: ['node_modules/@types', 'node_modules/payload'],
                  enableSemanticValidation: true,
                },
              }),

              {
                slug: 'myBlock',
                fields: [
                  {
                    name: 'someText',
                    type: 'text',
                  },
                ],
              },
            ],
            inlineBlocks: [
              {
                slug: 'myInlineBlock',
                fields: [
                  {
                    name: 'someText',
                    type: 'text',
                  },
                ],
              },
              {
                slug: 'inlineBlockWithSelect',
                interfaceName: 'InlineBlockWithSelect',
                fields: [
                  {
                    // Having this specific select field here reproduces an issue where the initial state is not applied on load, and every
                    // inline block will make its own form state request on load.
                    name: 'styles',
                    type: 'select',
                    hasMany: true,
                    options: [
                      { label: 'Option 1', value: 'opt1' },
                      { label: 'Option 2', value: 'opt2' },
                    ],
                    defaultValue: [],
                  },
                ],
              },
              {
                slug: 'inlineBlockWithRelationship',
                fields: [
                  {
                    name: 'relationship',
                    type: 'relationship',
                    relationTo: 'text-fields',
                    admin: {
                      // Required to reproduce issue: https://github.com/payloadcms/payload/issues/13778
                      appearance: 'drawer',
                    },
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
