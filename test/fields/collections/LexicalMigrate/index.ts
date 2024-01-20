import type { CollectionConfig } from '../../../../packages/payload/src/collections/config/types'

import {
  HTMLConverterFeature,
  LexicalPluginToLexicalFeature,
  LinkFeature,
  SlateToLexicalFeature,
  TreeViewFeature,
  UploadFeature,
  lexicalEditor,
  lexicalHTML,
} from '../../../../packages/richtext-lexical/src'
import { lexicalMigrateFieldsSlug } from '../../slugs'
import { getSimpleLexicalData } from './data'

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
      name: 'lexicalWithLexicalPluginData',
      type: 'richText',
      editor: lexicalEditor({
        features: ({ defaultFeatures }) => [
          ...defaultFeatures,
          LexicalPluginToLexicalFeature(),
          TreeViewFeature(),
          HTMLConverterFeature(),
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
    {
      name: 'lexicalWithSlateData',
      type: 'richText',
      editor: lexicalEditor({
        features: ({ defaultFeatures }) => [
          ...defaultFeatures,
          SlateToLexicalFeature(),
          TreeViewFeature(),
          HTMLConverterFeature(),
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
    {
      name: 'lexicalSimple',
      type: 'richText',
      editor: lexicalEditor({
        features: ({ defaultFeatures }) => [...defaultFeatures, HTMLConverterFeature()],
      }),
      defaultValue: getSimpleLexicalData('simple'),
    },
    lexicalHTML('lexicalSimple', { name: 'lexicalSimple_html' }),
    {
      name: 'groupWithLexicalField',
      type: 'group',
      fields: [
        {
          name: 'lexicalInGroupField',
          type: 'richText',
          editor: lexicalEditor({
            features: ({ defaultFeatures }) => [...defaultFeatures, HTMLConverterFeature()],
          }),
          defaultValue: getSimpleLexicalData('group'),
        },
        lexicalHTML('lexicalInGroupField', { name: 'lexicalInGroupField_html' }),
      ],
    },
    {
      name: 'arrayWithLexicalField',
      type: 'array',
      fields: [
        {
          name: 'lexicalInArrayField',
          type: 'richText',
          editor: lexicalEditor({
            features: ({ defaultFeatures }) => [...defaultFeatures, HTMLConverterFeature()],
          }),
        },
        lexicalHTML('lexicalInArrayField', { name: 'lexicalInArrayField_html' }),
      ],
    },
  ],
}
