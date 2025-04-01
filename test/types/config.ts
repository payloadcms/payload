import { lexicalEditor } from '@payloadcms/richtext-lexical'
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
    },
  ],
  admin: {
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  editor: lexicalEditor({}),
  globals: [
    {
      slug: 'menu',
      versions: true,
      fields: [
        {
          type: 'text',
          name: 'text',
        },
      ],
    },
  ],
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
})
