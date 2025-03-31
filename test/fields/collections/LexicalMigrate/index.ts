import type { CollectionConfig } from 'payload'

import {
  lexicalEditor,
  lexicalHTMLField,
  LinkFeature,
  TreeViewFeature,
  UploadFeature,
} from '@payloadcms/richtext-lexical'
import {
  LexicalPluginToLexicalFeature,
  SlateToLexicalFeature,
} from '@payloadcms/richtext-lexical/migrate'

import { lexicalMigrateFieldsSlug } from '../../slugs.js'
import { getSimpleLexicalData } from './data.js'

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
          LexicalPluginToLexicalFeature({ quiet: true }),
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
        ],
      }),
    },
    {
      name: 'lexicalSimple',
      type: 'richText',
      editor: lexicalEditor({
        features: ({ defaultFeatures }) => [...defaultFeatures],
      }),
      defaultValue: getSimpleLexicalData('simple'),
    },
    lexicalHTMLField({ htmlFieldName: 'lexicalSimple_html', lexicalFieldName: 'lexicalSimple' }),
    {
      name: 'groupWithLexicalField',
      type: 'group',
      fields: [
        {
          name: 'lexicalInGroupField',
          type: 'richText',
          editor: lexicalEditor({
            features: ({ defaultFeatures }) => [...defaultFeatures],
          }),
          defaultValue: getSimpleLexicalData('group'),
        },
        lexicalHTMLField({
          htmlFieldName: 'lexicalInGroupField_html',
          lexicalFieldName: 'lexicalInGroupField',
        }),
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
            features: ({ defaultFeatures }) => [...defaultFeatures],
          }),
        },
        lexicalHTMLField({
          htmlFieldName: 'lexicalInArrayField_html',
          lexicalFieldName: 'lexicalInArrayField',
        }),
      ],
    },
  ],
}
