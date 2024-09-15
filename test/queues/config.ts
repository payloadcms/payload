import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { fileURLToPath } from 'node:url'
import path from 'path'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { devUser } from '../credentials.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfigWithDefaults({
  collections: [
    {
      slug: 'posts',
      admin: {
        useAsTitle: 'title',
      },
      fields: [
        {
          name: 'title',
          type: 'text',
          required: true,
        },
        {
          name: 'content',
          type: 'richText',
        },
      ],
    },
  ],
  admin: {
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  queues: {
    jobsCollectionOverrides: ({ defaultJobsCollection }) => {
      return {
        ...defaultJobsCollection,
        admin: {
          ...defaultJobsCollection.admin,
          hidden: false,
        },
      }
    },
    jobs: [
      {
        retries: 2,
        slug: 'myJob',
        steps: [
          {
            retries: 2,
            schema: {
              slug: 'logStuff',
              fields: [
                {
                  name: 'someData',
                  type: 'text',
                },
                {
                  name: 'owner',
                  type: 'relationship',
                  relationTo: 'users',
                },
              ],
            },
            run: '/my-path/run',
          },
          {
            retries: 2,
            schema: {
              slug: 'logMoreStuff',
              fields: [
                {
                  name: 'someData',
                  type: 'text',
                },
                {
                  name: 'owner',
                  type: 'relationship',
                  relationTo: 'users',
                },
              ],
            },
            run: '/my-path/run',
          },
        ],
      },
    ],
  },
  editor: lexicalEditor(),
  onInit: async (payload) => {
    await payload.create({
      collection: 'users',
      data: {
        email: devUser.email,
        password: devUser.password,
      },
    })
  },
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
})
