import type { Config, GlobalConfig } from 'payload'

import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { fileURLToPath } from 'node:url'
import path from 'path'

import { devUser } from '@tools/test-utils/shared'
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
    },
    {
      slug: 'rels',
      fields: [{ type: 'text', name: 'text' }],
    },
    {
      slug: 'relationships-blocks',
      fields: [
        {
          type: 'blocks',
          name: 'blocks',
          blocks: [
            {
              slug: 'block',
              fields: [
                {
                  type: 'relationship',
                  name: 'hasMany',
                  relationTo: 'rels',
                  hasMany: true,
                },
                {
                  type: 'relationship',
                  name: 'hasOne',
                  relationTo: 'rels',
                },
              ],
            },
          ],
        },
      ],
    },
    CustomID,
    UsersCollection,
  ],
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
    },
    {
      slug: 'force-select-global',
      fields: [
        {
          name: 'text',
          type: 'text',
        },
        {
          name: 'forceSelected',
          type: 'text',
        },
        {
          name: 'array',
          type: 'array',
          fields: [
            {
              name: 'forceSelected',
              type: 'text',
            },
          ],
        },
      ],
      forceSelect: { array: { forceSelected: true }, forceSelected: true },
    } satisfies GlobalConfig<'force-select-global'>,
  ],
  admin: {
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  localization: {
    locales: ['en', 'de'],
    defaultLocale: 'en',
  },
  editor: lexicalEditor({
    features: ({ defaultFeatures }) => [...defaultFeatures],
  }),
  cors: ['http://localhost:3000', 'http://localhost:3001'],
  onInit: async (payload) => {
    await payload.create({
      collection: 'users',
      data: {
        email: devUser.email,
        password: devUser.password,
      },
    })

    // // Create image
    // const imageFilePath = path.resolve(dirname, '../uploads/image.png')
    // const imageFile = await getFileByPath(imageFilePath)

    // await payload.create({
    //   collection: 'media',
    //   data: {},
    //   file: imageFile,
    // })
  },
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
})
