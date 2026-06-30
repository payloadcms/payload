import {
  BlocksFeature,
  lexicalEditor,
  RelationshipFeature,
  UploadFeature,
} from '@payloadcms/richtext-lexical'
import { fileURLToPath } from 'node:url'
import path from 'path'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfigWithDefaults({
  // ...extend config here
  collections: [
    {
      slug: 'posts',
      versions: true,
      fields: [
        {
          type: 'text',
          name: 'text',
        },
        {
          type: 'richText',
          name: 'richText',
          required: true,
        },
        {
          type: 'text',
          name: 'title',
        },
        {
          name: 'selectField',
          type: 'select',
          required: true,
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
        },
        {
          type: 'group',
          label: 'Unnamed Group',
          fields: [
            {
              type: 'text',
              name: 'insideUnnamedGroup',
            },
          ],
        },
        {
          type: 'group',
          name: 'namedGroup',
          fields: [
            {
              type: 'text',
              name: 'insideNamedGroup',
            },
          ],
        },
        {
          name: 'radioField',
          type: 'radio',
          required: true,
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
    },
    {
      slug: 'pages',
      fields: [
        {
          type: 'text',
          name: 'title',
        },
        {
          type: 'relationship',
          relationTo: 'pages-categories',
          name: 'category',
        },
      ],
      versions: false,
    },
    {
      slug: 'pages-categories',
      fields: [
        {
          type: 'text',
          name: 'title',
        },
        {
          type: 'join',
          name: 'relatedPages',
          collection: 'pages',
          on: 'category',
        },
      ],
      versions: false,
    },
    {
      slug: 'draft-posts',
      versions: {
        drafts: true,
      },
      fields: [
        {
          type: 'text',
          name: 'title',
          required: true,
        },
        {
          type: 'text',
          name: 'description',
          required: true,
        },
      ],
    },
    {
      slug: 'media',
      upload: true,
      fields: [
        {
          type: 'text',
          name: 'alt',
        },
      ],
    },
    {
      slug: 'gallery',
      upload: true,
      fields: [
        {
          type: 'text',
          name: 'title',
        },
      ],
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
        { name: 'categories', type: 'relationship', hasMany: true, relationTo: 'pages-categories' },
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
                  { slug: 'cta', fields: [{ name: 'link', type: 'relationship', relationTo: 'pages' }] },
                ],
              }),
            ],
          }),
        },
        { name: 'computedTitle', type: 'text', virtual: true },
      ],
      versions: false,
    },
  ],
  admin: {
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  editor: lexicalEditor({
    features: ({ defaultFeatures }) => [
      ...defaultFeatures.filter((f) => f.key !== 'upload'),
      UploadFeature({
        collections: {
          media: {
            fields: [{ name: 'caption', type: 'text' }],
          },
          gallery: {
            fields: [{ name: 'altText', type: 'text', required: true }],
          },
        },
      }),
    ],
  }),
  globals: [
    {
      slug: 'menu',
      versions: true,
      fields: [
        {
          type: 'text',
          name: 'text',
        },
        {
          type: 'richText',
          name: 'richText',
        },
      ],
    },
    {
      slug: 'settings',
      versions: {
        drafts: true,
      },
      fields: [
        {
          type: 'text',
          name: 'siteName',
        },
      ],
    },
  ],
  typescript: {
    generateInputTypes: true,
    outputFile: path.resolve(dirname, 'payload-types.ts'),
    strictDraftTypes: true,
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
})
