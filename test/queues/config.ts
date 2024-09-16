import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { fileURLToPath } from 'node:url'
import path from 'path'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { devUser } from '../credentials.js'
import { updatePostStep1, updatePostStep2 } from './runners/updatePost.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfigWithDefaults({
  collections: [
    {
      slug: 'posts',
      admin: {
        useAsTitle: 'title',
      },
      hooks: {
        afterChange: [
          async ({ req, doc }) => {
            await req.payload.create({
              collection: 'payload-jobs',
              req,
              data: {
                type: 'updatePost',
                steps: [
                  {
                    blockType: 'step1',
                    post: doc.id,
                    message: 'hello',
                  },
                  {
                    blockType: 'step2',
                    post: doc.id,
                    message: 'goodbye',
                  },
                ],
              },
            })
          },
        ],
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
        {
          name: 'jobStep1Ran',
          type: 'text',
        },
        {
          name: 'jobStep2Ran',
          type: 'text',
        },
      ],
    },
  ],
  admin: {
    importMap: {
      baseDir: path.resolve(dirname),
    },
    autoLogin: false,
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
        slug: 'updatePost',
        steps: [
          {
            retries: 2,
            schema: {
              slug: 'step1',
              interfaceName: 'UpdatePostStep1',
              fields: [
                {
                  name: 'post',
                  type: 'relationship',
                  relationTo: 'posts',
                  maxDepth: 0,
                  required: true,
                },
                {
                  name: 'message',
                  type: 'text',
                  required: true,
                },
              ],
            },
            run: updatePostStep1,
          },
          {
            retries: 2,
            schema: {
              slug: 'step2',
              interfaceName: 'UpdatePostStep2',
              fields: [
                {
                  name: 'post',
                  type: 'relationship',
                  relationTo: 'posts',
                  maxDepth: 0,
                  required: true,
                },
                {
                  name: 'message',
                  type: 'text',
                  required: true,
                },
              ],
            },
            run: updatePostStep2,
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
