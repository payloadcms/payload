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
              req,
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
        handler: updatePostStep1,
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
        handler: updatePostStep2,
      } as TaskConfig<'UpdatePostStep2'>,
      {
        retries: 3,
        slug: 'CreateSimple',
        inputSchema: [
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
        handler: async ({ input, job, req }) => {
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
        handler: async ({ input, job, req }) => {
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
      {
        retries: 2,
        slug: 'ExternalTask',
        inputSchema: [
          {
            name: 'message',
            type: 'text',
            required: true,
          },
        ],
        outputSchema: [
          {
            name: 'simpleID',
            type: 'text',
            required: true,
          },
        ],
        handler: path.resolve(dirname, 'runners/externalTask.ts') + '#externalTaskHandler',
      } as TaskConfig<'ExternalTask'>,
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
        handler: async ({ job, runTask }) => {
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
        handler: async ({ job, runTask }) => {
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
        slug: 'retriesRollbackTest',
        inputSchema: [
          {
            name: 'message',
            type: 'text',
            required: true,
          },
        ],
        handler: async ({ job, runTaskInline }) => {
          // @ts-expect-error amountRetried is new arbitrary data and not in the type
          job.input.amountRetried =
            // @ts-expect-error amountRetried is new arbitrary data and not in the type
            job.input.amountRetried !== undefined ? job.input.amountRetried + 1 : 0

          await runTaskInline({
            task: async ({ req }) => {
              const newSimple = await req.payload.create({
                collection: 'simple',
                req,
                data: {
                  title: job.input.message,
                },
              })
              return {
                output: {
                  simpleID: newSimple.id,
                },
              }
            },
            id: '1',
          })

          await runTaskInline({
            task: async ({ req }) => {
              await req.payload.create({
                collection: 'simple',
                req,
                data: {
                  title: 'should not exist',
                },
              })
              // Fail afterwards, so that we can also test that transactions work (i.e. the job is rolled back)

              throw new Error('Failed on purpose')
            },
            id: '2',
            retries: {
              attempts: 4,
            },
          })
        },
      } as WorkflowConfig<'retriesRollbackTest'>,
      {
        slug: 'retriesWorkflowLevelTest',
        inputSchema: [
          {
            name: 'message',
            type: 'text',
            required: true,
          },
        ],
        retries: 2, // Even though CreateSimple has 3 retries, this workflow only has 2. Thus, it will only retry once
        handler: async ({ job, runTask }) => {
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
      } as WorkflowConfig<'retriesWorkflowLevelTest'>,
      {
        slug: 'inlineTaskTest',
        inputSchema: [
          {
            name: 'message',
            type: 'text',
            required: true,
          },
        ],
        handler: async ({ job, runTaskInline }) => {
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
      {
        slug: 'externalWorkflow',
        inputSchema: [
          {
            name: 'message',
            type: 'text',
            required: true,
          },
        ],
        handler: path.resolve(dirname, 'runners/externalWorkflow.ts') + '#externalWorkflowHandler',
      } as WorkflowConfig<'externalWorkflow'>,
      {
        slug: 'retriesBackoffTest',
        inputSchema: [
          {
            name: 'message',
            type: 'text',
            required: true,
          },
        ],
        handler: async ({ job, runTaskInline }) => {
          // @ts-expect-error amountRetried is new arbitrary data and not in the type
          job.input.amountRetried =
            // @ts-expect-error amountRetried is new arbitrary data and not in the type
            job.input.amountRetried !== undefined ? job.input.amountRetried + 1 : 0

          await runTaskInline({
            task: async ({ req }) => {
              const totalTried = job?.taskStatus?.inline?.['1']?.totalTried || 0

              const { id } = await req.payload.create({
                collection: 'simple',
                req,
                data: {
                  title: 'should not exist',
                },
              })

              // @ts-expect-error timeTried is new arbitrary data and not in the type
              if (!job.input.timeTried) {
                // @ts-expect-error timeTried is new arbitrary data and not in the type
                job.input.timeTried = {}
              }

              // @ts-expect-error timeTried is new arbitrary data and not in the type
              job.input.timeTried[totalTried] = new Date().toISOString()

              if (totalTried < 4) {
                // Cleanup the post
                await req.payload.delete({
                  collection: 'simple',
                  id,
                  req,
                })

                // Last try it should succeed
                throw new Error('Failed on purpose')
              }
              return {
                output: {},
              }
            },
            id: '1',
            retries: {
              attempts: 4,
              backoff: {
                type: 'exponential',
                // Should retry in 300ms, then 600, then 1200, then 2400, then succeed
                delay: 300,
              },
            },
          })
        },
      } as WorkflowConfig<'retriesBackoffTest'>,
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
