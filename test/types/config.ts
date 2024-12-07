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
      ],
    },
    {
      slug: 'relationships',
      fields: [
        {
          type: 'relationship',
          relationTo: 'posts',
          name: 'one',
          required: true,
        },
        {
          type: 'relationship',
          relationTo: 'posts',
          name: 'oneOptional',
        },
        {
          type: 'relationship',
          relationTo: 'posts',
          required: true,
          hasMany: true,
          name: 'many',
        },
        {
          type: 'relationship',
          relationTo: 'posts',
          hasMany: true,
          name: 'manyOptional',
        },
        {
          type: 'relationship',
          relationTo: ['posts', 'users'],
          name: 'onePoly',
          required: true,
        },
        {
          type: 'relationship',
          relationTo: ['posts', 'users'],
          name: 'onePolyOptional',
        },
        {
          type: 'relationship',
          relationTo: ['posts', 'users'],
          name: 'manyPoly',
          required: true,
          hasMany: true,
        },
        {
          type: 'relationship',
          relationTo: ['posts', 'users'],
          hasMany: true,
          name: 'manyPolyOptional',
        },
      ],
    },
    {
      slug: 'relationships-to-joins',
      fields: [
        {
          name: 'join',
          type: 'relationship',
          relationTo: 'joins',
          required: true,
        },
      ],
    },
    {
      slug: 'joins',
      fields: [
        {
          name: 'relatedRelations',
          type: 'join',
          on: 'join',
          collection: 'relationships-to-joins',
        },
      ],
    },
    {
      slug: 'relationships-deep',
      fields: [
        {
          type: 'relationship',
          name: 'depthTwoOne',
          relationTo: 'relationships',
          required: true,
        },
        {
          type: 'group',
          name: 'group',
          fields: [
            {
              name: 'blocks',
              type: 'blocks',
              blocks: [
                {
                  slug: 'first',
                  fields: [
                    {
                      type: 'relationship',
                      relationTo: 'posts',
                      name: 'oneFirst',
                      required: true,
                    },
                  ],
                },
                {
                  slug: 'second',
                  fields: [
                    {
                      type: 'relationship',
                      relationTo: 'posts',
                      name: 'oneSecond',
                      required: true,
                    },
                  ],
                },
              ],
            },
            {
              name: 'array',
              type: 'array',
              fields: [
                {
                  type: 'relationship',
                  relationTo: 'posts',
                  name: 'one',
                  required: true,
                },
                {
                  type: 'relationship',
                  relationTo: 'posts',
                  required: true,
                  hasMany: true,
                  name: 'many',
                },
              ],
            },
          ],
        },
      ],
    },
  ],
  defaultDepth: 0,
  maxDepth: 5,
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
    typeSafeDepth: true,
  },
})
