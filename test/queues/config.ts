import type { TaskConfig, WorkflowConfig } from 'payload'

import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { fileURLToPath } from 'node:url'
import path from 'path'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { devUser } from '../credentials.js'
import { updatePostStep1, updatePostStep2 } from './runners/updatePost.js'
import { clearAndSeedEverything } from './seed.js'

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
            await req.payload.jobs.queue({
              workflow: 'updatePost',
              input: {
                post: doc.id,
                message: 'hello',
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
    {
      slug: 'simple',
      admin: {
        useAsTitle: 'title',
      },
      fields: [
        {
          name: 'title',
          type: 'text',
          required: true,
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
      } as TaskConfig<'UpdatePost'>,
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
      } as TaskConfig<'UpdatePostStep2'>,
      {
        retries: 2,
        slug: 'CreateSimple',
        inputSchema: [
          ,
          {
            name: 'message',
            type: 'text',
            required: true,
          },
          {
            name: 'shouldFail',
            type: 'checkbox',
          },
        ],
        outputSchema: [
          {
            name: 'simpleID',
            type: 'text',
            required: true,
          },
        ],
        run: async ({ input, job, req }) => {
          if (input.shouldFail) {
            throw new Error('Failed on purpose')
          }
          const newSimple = await req.payload.create({
            collection: 'simple',
            req,
            data: {
              title: input.message,
            },
          })
          return {
            output: {
              simpleID: newSimple.id,
            },
          }
        },
      } as TaskConfig<'CreateSimple'>,
      {
        retries: 2,
        slug: 'CreateSimpleWithDuplicateMessage',
        inputSchema: [
          ,
          {
            name: 'message',
            type: 'text',
            required: true,
          },
          {
            name: 'shouldFail',
            type: 'checkbox',
          },
        ],
        outputSchema: [
          {
            name: 'simpleID',
            type: 'text',
            required: true,
          },
        ],
        run: async ({ input, job, req }) => {
          if (input.shouldFail) {
            throw new Error('Failed on purpose')
          }
          const newSimple = await req.payload.create({
            collection: 'simple',
            req,
            data: {
              title: input.message + input.message,
            },
          })
          return {
            output: {
              simpleID: newSimple.id,
            },
          }
        },
      } as TaskConfig<'CreateSimpleWithDuplicateMessage'>,
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
              post: job.taskStatus.UpdatePost['1'].input.post,
              messageTwice: job.taskStatus.UpdatePost['1'].output.messageTwice,
            },
          })
        },
      } as WorkflowConfig<'updatePost'>,
      {
        slug: 'retriesTest',
        inputSchema: [
          {
            name: 'message',
            type: 'text',
            required: true,
          },
        ],
        controlFlowInJS: async ({ job, runTask }) => {
          // @ts-expect-error amountRetried is new arbitrary data and not in the type
          job.input.amountRetried =
            // @ts-expect-error amountRetried is new arbitrary data and not in the type
            job.input.amountRetried !== undefined ? job.input.amountRetried + 1 : 0

          await runTask({
            task: 'CreateSimple',
            id: '1',
            input: {
              message: job.input.message,
            },
          })

          // At this point there should always be one post created.
          // job.input.amountRetried will go up to 2 as CreatePost has 2 retries
          await runTask({
            task: 'CreateSimple',
            id: '2',
            input: {
              message: job.input.message,
              shouldFail: true,
            },
          })
          // This will never be reached
        },
      } as WorkflowConfig<'retriesTest'>,
      {
        slug: 'inlineTaskTest',
        inputSchema: [
          {
            name: 'message',
            type: 'text',
            required: true,
          },
        ],
        controlFlowInJS: async ({ job, runTaskInline }) => {
          await runTaskInline({
            task: async ({ input, req }) => {
              const newSimple = await req.payload.create({
                collection: 'simple',
                req,
                data: {
                  title: input.message,
                },
              })
              return {
                output: {
                  simpleID: newSimple.id,
                },
              }
            },
            id: '1',
            input: {
              message: job.input.message,
            },
          })
        },
      } as WorkflowConfig<'inlineTaskTest'>,
    ],
  },
  editor: lexicalEditor(),
  onInit: async (payload) => {
    if (process.env.SEED_IN_CONFIG_ONINIT !== 'false') {
      await clearAndSeedEverything(payload)
    }
  },
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
})
