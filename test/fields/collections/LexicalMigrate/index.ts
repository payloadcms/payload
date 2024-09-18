import type { CollectionConfig } from 'payload'

import {
  HTMLConverterFeature,
  lexicalEditor,
  lexicalHTML,
  LinkFeature,
  TreeViewFeature,
  UploadFeature,
} from '@payloadcms/richtext-lexical'
import {
  LexicalPluginToLexicalFeature,
  SlateToLexicalFeature,
} from '@payloadcms/richtext-lexical/migrate'

import { lexicalMigrateFieldsSlug } from '../../slugs.js'
import { getAlignIndentLexicalData, getSimpleLexicalData } from './data.js'

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
          HTMLConverterFeature(),
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
          HTMLConverterFeature(),
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
        features: ({ defaultFeatures }) => [...defaultFeatures, HTMLConverterFeature()],
      }),
      defaultValue: getSimpleLexicalData('simple'),
    },
    lexicalHTML('lexicalSimple', { name: 'lexicalSimple_html' }),
    {
      name: 'lexicalStyledIndentAlign',
      type: 'richText',
      editor: lexicalEditor({
        features: ({ defaultFeatures }) => [...defaultFeatures, HTMLConverterFeature()],
      }),
      defaultValue: getAlignIndentLexicalData('styled'),
    },
    lexicalHTML('lexicalStyledIndentAlign', { name: 'lexicalStyledIndentAlign_html' }),
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
