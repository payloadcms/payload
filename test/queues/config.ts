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
                input: {
                  post: doc.id,
                  message: 'hello',
                },
                workflowSlug: 'updatePost',
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
    autoLogin: {
      prefillOnly: true,
      email: devUser.email,
      password: devUser.password,
    },
  },
  jobs: {
    jobsCollectionOverrides: ({ defaultJobsCollection }) => {
      return {
        ...defaultJobsCollection,
        admin: {
          ...(defaultJobsCollection?.admin || {}),
          hidden: false,
        },
      }
    },
    tasks: [
      {
        retries: 2,
        slug: 'UpdatePost',
        inputSchema: [
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
        outputSchema: [
          {
            name: 'messageTwice',
            type: 'text',
            required: true,
          },
        ],
        run: updatePostStep1,
      },
      {
        retries: 2,
        slug: 'UpdatePostStep2',
        inputSchema: [
          {
            name: 'post',
            type: 'relationship',
            relationTo: 'posts',
            maxDepth: 0,
            required: true,
          },
          {
            name: 'messageTwice',
            type: 'text',
            required: true,
          },
        ],
        run: updatePostStep2,
      },
    ],
    workflows: [
      {
        slug: 'updatePost',
        inputSchema: [
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
        controlFlowInJS: async ({ job, runTask }) => {
          const output = await runTask({
            task: 'UpdatePost',
            id: '1',
            input: {
              post: job.input.post,
              message: job.input.message,
            },
          })

          await runTask({
            task: 'UpdatePostStep2',
            id: '2',
            input: {
              post: job.tasks.UpdatePost['1'].input.post,
              messageTwice: job.tasks.UpdatePost['1'].output.messageTwice,
            },
          })
        },
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
