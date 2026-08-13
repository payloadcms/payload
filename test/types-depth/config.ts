import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { fileURLToPath } from 'node:url'
import path from 'path'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

/**
 * Config for `typescript.typeSafeDepth`. It lives in its own suite rather than in `test/types`
 * because enabling the flag rewrites the result type of every Local API call, which would
 * invalidate the assertions there that intentionally test the non-depth-aware types.
 */
export default buildConfigWithDefaults({
  admin: {
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [
    {
      slug: 'posts',
      fields: [
        {
          name: 'text',
          type: 'text',
        },
      ],
    },
    {
      slug: 'media',
      fields: [],
      upload: true,
    },
    {
      // A `json` field is generated as a union of primitives, objects and arrays, which must not be
      // mistaken for a relationship - see `HasCollectionType`.
      slug: 'passthrough',
      fields: [
        {
          name: 'json',
          type: 'json',
        },
        {
          name: 'upload',
          type: 'upload',
          relationTo: 'media',
        },
        {
          name: 'unnamedGroup',
          type: 'group',
          fields: [
            {
              name: 'insideUnnamedGroup',
              type: 'relationship',
              relationTo: 'posts',
              required: true,
            },
          ],
          label: 'Unnamed Group',
        },
      ],
    },
    {
      slug: 'relationships',
      fields: [
        {
          name: 'one',
          type: 'relationship',
          relationTo: 'posts',
          required: true,
        },
        {
          name: 'oneOptional',
          type: 'relationship',
          relationTo: 'posts',
        },
        {
          name: 'many',
          type: 'relationship',
          hasMany: true,
          relationTo: 'posts',
          required: true,
        },
        {
          name: 'manyOptional',
          type: 'relationship',
          hasMany: true,
          relationTo: 'posts',
        },
        {
          name: 'onePoly',
          type: 'relationship',
          relationTo: ['posts', 'users'],
          required: true,
        },
        {
          name: 'onePolyOptional',
          type: 'relationship',
          relationTo: ['posts', 'users'],
        },
        {
          name: 'manyPoly',
          type: 'relationship',
          hasMany: true,
          relationTo: ['posts', 'users'],
          required: true,
        },
        {
          name: 'manyPolyOptional',
          type: 'relationship',
          hasMany: true,
          relationTo: ['posts', 'users'],
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
          collection: 'relationships-to-joins',
          on: 'join',
        },
      ],
    },
    {
      slug: 'relationships-deep',
      fields: [
        {
          name: 'depthTwoOne',
          type: 'relationship',
          relationTo: 'relationships',
          required: true,
        },
        {
          name: 'group',
          type: 'group',
          fields: [
            {
              name: 'blocks',
              type: 'blocks',
              blocks: [
                {
                  slug: 'first',
                  fields: [
                    {
                      name: 'oneFirst',
                      type: 'relationship',
                      relationTo: 'posts',
                      required: true,
                    },
                  ],
                },
                {
                  slug: 'second',
                  fields: [
                    {
                      name: 'oneSecond',
                      type: 'relationship',
                      relationTo: 'posts',
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
                  name: 'one',
                  type: 'relationship',
                  relationTo: 'posts',
                  required: true,
                },
                {
                  name: 'many',
                  type: 'relationship',
                  hasMany: true,
                  relationTo: 'posts',
                  required: true,
                },
              ],
            },
          ],
        },
      ],
    },
  ],
  defaultDepth: 0,
  editor: lexicalEditor({}),
  globals: [
    {
      slug: 'menu',
      fields: [
        {
          name: 'relatedPost',
          type: 'relationship',
          relationTo: 'posts',
          required: true,
        },
      ],
    },
  ],
  maxDepth: 5,
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
    typeSafeDepth: true,
  },
})
