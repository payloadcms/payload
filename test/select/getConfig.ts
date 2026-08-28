import type { Config, GlobalConfig } from 'payload'

import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { fileURLToPath } from 'node:url'
import path from 'path'

import { devUser } from '../credentials.js'
import { CustomID } from './collections/CustomID/index.js'
import { DeepPostsCollection } from './collections/DeepPosts/index.js'
import { ForceSelect } from './collections/ForceSelect/index.js'
import { LocalizedPostsCollection } from './collections/LocalizedPosts/index.js'
import { Pages } from './collections/Pages/index.js'
import { Points } from './collections/Points/index.js'
import { PostsCollection } from './collections/Posts/index.js'
import { UsersCollection } from './collections/Users/index.js'
import { VersionedPostsCollection } from './collections/VersionedPosts/index.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export const getConfig: () => Partial<Config> = () => ({
  // ...extend config here
  admin: {
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [
    PostsCollection,
    LocalizedPostsCollection,
    VersionedPostsCollection,
    DeepPostsCollection,
    Pages,
    Points,
    ForceSelect,
    {
      slug: 'upload',
      fields: [],
      upload: {
        staticDir: path.resolve(dirname, 'media'),
      },
      versions: false,
    },
    {
      slug: 'rels',
      fields: [{ name: 'text', type: 'text' }],
      versions: false,
    },
    {
      slug: 'relationships-blocks',
      fields: [
        {
          name: 'blocks',
          type: 'blocks',
          blocks: [
            {
              slug: 'block',
              fields: [
                {
                  name: 'hasMany',
                  type: 'relationship',
                  hasMany: true,
                  relationTo: 'rels',
                },
                {
                  name: 'hasOne',
                  type: 'relationship',
                  relationTo: 'rels',
                },
              ],
            },
          ],
        },
      ],
      versions: false,
    },
    CustomID,
    UsersCollection,
  ],
  cors: [`http://localhost:${process.env.PORT || 3000}`, 'http://localhost:3001'],
  editor: lexicalEditor({
    features: ({ defaultFeatures }) => [...defaultFeatures],
  }),
  globals: [
    {
      slug: 'global-post',
      fields: [
        {
          name: 'text',
          type: 'text',
        },
        {
          name: 'number',
          type: 'number',
        },
      ],
      versions: false,
    },
    {
      slug: 'force-select-global',
      fields: [
        {
          name: 'text',
          type: 'text',
        },
        {
          name: 'field1',
          type: 'text',
        },
        {
          name: 'field2',
          type: 'text',
        },
      ],
      select: ({ select }) => {
        if (!select) {
          return undefined
        }

        if (select?.field1) {
          return { field1: true, field2: true }
        }

        return select
      },
      versions: false,
    } satisfies GlobalConfig<'force-select-global'>,
  ],
  localization: {
    defaultLocale: 'en',
    locales: ['en', 'de'],
  },
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
})

export const seed: NonNullable<Config['onInit']> = async (payload) => {
  await payload.create({
    collection: 'users',
    data: {
      email: devUser.email,
      password: devUser.password,
    },
  })
}
