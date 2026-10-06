import {
  BlocksFeature,
  lexicalEditor,
  RelationshipFeature,
  UploadFeature,
} from '@payloadcms/richtext-lexical'
import { fileURLToPath } from 'node:url'
import path from 'path'
import { defaultUserCollection } from 'payload'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfigWithDefaults({
  config: {
    // ...extend config here
    admin: {
      importMap: {
        baseDir: path.resolve(dirname),
      },
      user: 'users',
    },
    collections: [
      {
        slug: 'posts',
        fields: [
          {
            name: 'text',
            type: 'text',
          },
          {
            name: 'richText',
            type: 'richText',
            required: true,
          },
          {
            name: 'title',
            type: 'text',
          },
          {
            name: 'selectField',
            type: 'select',
            interfaceName: 'MySelectOptions',
            options: [
              {
                label: 'Option 1',
                value: 'option-1',
              },
              {
                label: 'Option 2',
                value: 'option-2',
              },
            ],
            required: true,
          },
          {
            type: 'group',
            fields: [
              {
                name: 'insideUnnamedGroup',
                type: 'text',
              },
            ],
            label: 'Unnamed Group',
          },
          {
            name: 'namedGroup',
            type: 'group',
            fields: [
              {
                name: 'insideNamedGroup',
                type: 'text',
              },
            ],
          },
          {
            name: 'radioField',
            type: 'radio',
            interfaceName: 'MyRadioOptions',
            options: [
              {
                label: 'Option 1',
                value: 'option-1',
              },
              {
                label: 'Option 2',
                value: 'option-2',
              },
            ],
            required: true,
          },
          {
            name: 'externalType',
            type: 'text',
            jsonSchema: [
              () => ({
                $ref: './test/types/schemas/custom-type.json',
              }),
            ],
          },
        ],
        versions: true,
      },
      {
        slug: 'pages',
        fields: [
          {
            name: 'title',
            type: 'text',
          },
          {
            name: 'category',
            type: 'relationship',
            relationTo: 'pages-categories',
          },
        ],
        versions: false,
      },
      {
        slug: 'pages-categories',
        fields: [
          {
            name: 'title',
            type: 'text',
          },
          {
            name: 'relatedPages',
            type: 'join',
            collection: 'pages',
            on: 'category',
          },
        ],
        versions: false,
      },
      {
        slug: 'draft-posts',
        fields: [
          {
            name: 'title',
            type: 'text',
            required: true,
          },
          {
            name: 'description',
            type: 'text',
            required: true,
          },
        ],
        versions: {
          drafts: true,
        },
      },
      {
        slug: 'media',
        fields: [
          {
            name: 'alt',
            type: 'text',
          },
        ],
        upload: true,
      },
      {
        slug: 'gallery',
        fields: [
          {
            name: 'title',
            type: 'text',
          },
        ],
        upload: true,
      },
      {
        slug: 'fallback-users',
        auth: {
          loginWithUsername: {
            allowEmailLogin: true,
            requireEmail: false,
            requireUsername: false,
          },
          useAPIKey: true,
          verify: true,
        },
        fields: [
          {
            name: 'id',
            type: 'number',
          },
        ],
        timestamps: false,
        versions: false,
      },
      {
        // Exercises every input-vs-output divergence for the type tests in types.spec.ts.
        slug: 'input-types',
        fields: [
          { name: 'title', type: 'text', required: true },
          {
            name: 'status',
            type: 'select',
            defaultValue: 'draft',
            options: [
              { label: 'Draft', value: 'draft' },
              { label: 'Published', value: 'published' },
            ],
            required: true,
          },
          { name: 'category', type: 'relationship', relationTo: 'pages-categories' },
          {
            name: 'categories',
            type: 'relationship',
            hasMany: true,
            relationTo: 'pages-categories',
          },
          { name: 'related', type: 'relationship', relationTo: ['pages', 'pages-categories'] },
          { name: 'image', type: 'upload', relationTo: 'media' },
          {
            name: 'richText',
            type: 'richText',
            editor: lexicalEditor({
              features: ({ defaultFeatures }) => [
                ...defaultFeatures,
                RelationshipFeature(),
                BlocksFeature({
                  blocks: [
                    {
                      slug: 'cta',
                      fields: [{ name: 'link', type: 'relationship', relationTo: 'pages' }],
                    },
                  ],
                }),
              ],
            }),
          },
          { name: 'computedTitle', type: 'text', virtual: true },
        ],
        versions: false,
      },
      defaultUserCollection,
    ],
    editor: lexicalEditor({
      features: ({ defaultFeatures }) => [
        ...defaultFeatures.filter((f) => f.key !== 'upload'),
        UploadFeature({
          collections: {
            gallery: {
              fields: [{ name: 'altText', type: 'text', required: true }],
            },
            media: {
              fields: [{ name: 'caption', type: 'text' }],
            },
          },
        }),
      ],
    }),
    globals: [
      {
        slug: 'menu',
        fields: [
          {
            name: 'text',
            type: 'text',
          },
          {
            name: 'richText',
            type: 'richText',
          },
        ],
        versions: true,
      },
      {
        slug: 'settings',
        fields: [
          {
            name: 'siteName',
            type: 'text',
          },
        ],
        versions: {
          drafts: true,
        },
      },
    ],
    typescript: {
      generateInputTypes: true,
      outputFile: path.resolve(dirname, 'payload-types.ts'),
      postProcess: [
        ({ compiledTypes }) => {
          const genericType = `export type TestPluginGeneric<T> = { value: T };`
          // Insert after banner comment
          return compiledTypes.replace(/(\/\*[\s\S]*?\*\/\n)/, `$1\n${genericType}\n`)
        },
        ({ compiledTypes }) => {
          // Second function adds another type after the first
          return compiledTypes.replace(
            'export type TestPluginGeneric<T>',
            'export type SecondGeneric<K, V> = { key: K; value: V };\nexport type TestPluginGeneric<T>',
          )
        },
      ],
    },
  },
  suite: 'types',
})
